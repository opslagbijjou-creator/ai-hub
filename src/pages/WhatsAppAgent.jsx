import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Settings, Send, User, Clock, Check, CheckCircle2, Loader2, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const normalizeStatusHint = (value) => {
  const message = String(value || '');
  if (!message) return '';

  if (
    /execution context was destroyed|cannot find context with specified id|target closed|session closed|protocol error/i.test(
      message
    )
  ) {
    return 'WhatsApp synchroniseert nu. Wacht een paar seconden en klik daarna op "Historie verversen".';
  }

  return message;
};

const WhatsAppAgent = () => {
  const [waStatus, setWaStatus] = useState({
    connected: false,
    authenticated: false,
    phase: 'idle',
    qrCode: null
  });
  const [backendReachable, setBackendReachable] = useState(true);
  const [statusHint, setStatusHint] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const unreadCountRef = useRef(null);
  const selectedIncomingMessageRef = useRef(null);

  const [aiSettings, setAiSettings] = useState({ targetAudience: 'all', knowledge: '', calendarConnected: false });
  const [showSettings, setShowSettings] = useState(false);

  const authFetch = useCallback(async (endpoint, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Geen actieve sessie gevonden.');
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(920, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.warn('Kon notificatiegeluid niet afspelen:', error?.message || error);
    }
  }, []);

  const notifyDesktop = useCallback((title, body) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!document.hidden) return;
    try {
      new Notification(title, { body });
    } catch {
      // negeer
    }
  }, []);

  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await authFetch('/api/whatsapp/status');
      if (res.status === 401) {
        setBackendReachable(true);
        setStatusHint('Je sessie is verlopen. Log opnieuw in en ververs de pagina.');
        setWaStatus({
          connected: false,
          authenticated: false,
          phase: 'idle',
          qrCode: null,
          myNumber: null,
          initializing: false
        });
        return;
      }

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Status endpoint gaf een fout terug.');
      }

      const data = await res.json();
      setBackendReachable(true);
      setWaStatus(data);
      if (data.connected) {
        setStatusHint('');
      } else if (data.authenticated || data.phase === 'finalizing') {
        setStatusHint('QR geaccepteerd. Even geduld, we ronden de verbinding af...');
      } else {
        setStatusHint(normalizeStatusHint(data.lastError || ''));
      }

    } catch (error) {
      const message = error?.message || 'Onbekende fout bij ophalen status.';
      const isNetworkError = /Failed to fetch|NetworkError|load failed/i.test(message);
      setBackendReachable(!isNetworkError);
      setStatusHint(normalizeStatusHint(message));
      setWaStatus((prev) => ({
        ...prev,
        connected: false,
        authenticated: false,
        phase: 'idle',
        qrCode: null,
        myNumber: null,
        initializing: false
      }));
    }
  }, [authFetch]);

  // Poll for connection status
  useEffect(() => {
    const kickoffTimeout = setTimeout(() => {
      fetchWaStatus();
    }, 0);

    const intervalMs = waStatus.connected
      ? 2500
      : (waStatus.authenticated || waStatus.phase === 'finalizing' ? 800 : 1000);
    const interval = setInterval(fetchWaStatus, intervalMs);
    return () => {
      clearTimeout(kickoffTimeout);
      clearInterval(interval);
    };
  }, [fetchWaStatus, waStatus.connected, waStatus.authenticated, waStatus.phase]);

  // Fetch settings on load
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await authFetch('/api/settings');
        const data = await res.json();
        setAiSettings(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadSettings();
  }, [authFetch]);

  const saveSettings = async (newSettings) => {
    setAiSettings(newSettings);
    try {
      await authFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings)
      });
    } catch(e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoadingChats(true);
    }

    try {
      const query = silent
        ? '/api/whatsapp/chats?all=true&fast=true&cacheFirst=true'
        : '/api/whatsapp/chats?all=true&fast=true&cacheFirst=false';
      const res = await authFetch(query);
      const data = await res.json();
      if (!data.error && Array.isArray(data)) {
        setChats(data);
        setSelectedChat((currentSelected) => {
          if (!currentSelected) return currentSelected;
          const refreshedChat = data.find((chat) => chat.id === currentSelected.id);
          return refreshedChat || currentSelected;
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      if (!silent) {
        setIsLoadingChats(false);
      }
    }
  }, [authFetch]);

  const fetchMessages = useCallback(async (chatId, { silent = false } = {}) => {
    if (!chatId) return;
    if (!silent) {
      setIsLoadingMessages(true);
    }

    try {
      const encodedChatId = encodeURIComponent(chatId);
      const query = silent ? 'limit=120&sync=false' : 'limit=600&sync=false';
      const res = await authFetch(`/api/whatsapp/chat/${encodedChatId}/messages?${query}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Kon berichten niet laden.');
      }
      if (Array.isArray(data)) {
        if (!silent) {
          setMessages(data);
        } else {
          setMessages((prev) => {
            const byId = new Map(prev.map((msg) => [msg.id, msg]));
            for (const msg of data) {
              byId.set(msg.id, msg);
            }
            return Array.from(byId.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        }
      }
    } catch(e) {
      console.error(e);
      if (!silent) {
        setStatusHint(normalizeStatusHint(e?.message || 'Kon berichten niet laden.'));
      }
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
      }
    }
  }, [authFetch]);

  const handleResyncMessages = async () => {
    if (!selectedChat?.id) return;
    try {
      setIsLoadingMessages(true);
      const encodedChatId = encodeURIComponent(selectedChat.id);
      const res = await authFetch(`/api/whatsapp/chat/${encodedChatId}/messages?limit=2000&sync=true&forceSync=true`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Historie kon niet worden gesynchroniseerd.');
      }
      if (Array.isArray(data)) {
        setMessages(data);
        setStatusHint('');
      }
    } catch (error) {
      console.error(error);
      setStatusHint(normalizeStatusHint(error?.message || 'Historie kon niet worden gesynchroniseerd.'));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch chats + silent refresh (ook wanneer WhatsApp tijdelijk niet verbonden is)
  useEffect(() => {
    const kickoffTimeout = setTimeout(() => {
      fetchChats();
    }, 0);

    const refreshEveryMs = waStatus.connected ? 8000 : 20000;
    const interval = setInterval(() => {
      fetchChats({ silent: true });
    }, refreshEveryMs);

    return () => {
      clearTimeout(kickoffTimeout);
      clearInterval(interval);
    };
  }, [waStatus.connected, fetchChats]);

  // Fetch messages when a chat is selected + silent refresh
  useEffect(() => {
    if (!selectedChat?.id) return;

    const kickoffTimeout = setTimeout(() => {
      fetchMessages(selectedChat.id);
    }, 0);

    const interval = setInterval(() => {
      fetchMessages(selectedChat.id, { silent: true });
    }, 5000);

    return () => {
      clearTimeout(kickoffTimeout);
      clearInterval(interval);
    };
  }, [selectedChat?.id, fetchMessages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    if (unreadCountRef.current === null) {
      unreadCountRef.current = totalUnread;
      return;
    }

    if (totalUnread > unreadCountRef.current) {
      playNotificationSound();
      notifyDesktop('Nieuwe WhatsApp melding', 'Je hebt een nieuw ongelezen bericht.');
    }

    unreadCountRef.current = totalUnread;
  }, [chats, playNotificationSound, notifyDesktop]);

  useEffect(() => {
    selectedIncomingMessageRef.current = null;
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!selectedChat?.id || messages.length === 0) return;
    const incoming = [...messages].reverse().find((msg) => !msg.fromMe && (msg.body || '').trim().length > 0);
    if (!incoming) return;

    if (selectedIncomingMessageRef.current === null) {
      selectedIncomingMessageRef.current = incoming.id;
      return;
    }

    if (incoming.id !== selectedIncomingMessageRef.current) {
      selectedIncomingMessageRef.current = incoming.id;
      playNotificationSound();
      const chatTitle =
        selectedChat?.name || selectedChat?.phoneNumber || selectedChat?.id?.split('@')[0] || 'WhatsApp';
      notifyDesktop(chatTitle, incoming.body.slice(0, 120));
    }
  }, [messages, selectedChat, playNotificationSound, notifyDesktop]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;

    // Optimistic UI update
    const newMsg = {
      id: Date.now().toString(),
      body: input,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000)
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    try {
      await authFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: newMsg.body
        })
      });
      // Refresh kort na versturen om server-state te synchroniseren
      setTimeout(() => fetchMessages(selectedChat.id), 1000);
      setTimeout(() => fetchChats({ silent: true }), 1200);
    } catch (error) {
      console.error("Fout bij versturen:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const getChatDisplayName = (chat) => {
    if (!chat) return 'Onbekend contact';
    return chat.name || chat.phoneNumber || chat.id?.split('@')[0] || 'Onbekend contact';
  };

  const getChatPhoneLabel = (chat) => {
    if (!chat) return '';
    return chat.phoneNumber || chat.id?.split('@')[0] || '';
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Weet je zeker dat je de verbinding met WhatsApp wilt verbreken?")) return;
    try {
      await authFetch('/api/whatsapp/disconnect', { method: 'POST' });
      setWaStatus({
        connected: false,
        authenticated: false,
        phase: 'idle',
        qrCode: null,
        myNumber: null,
        initializing: false
      });
      setStatusHint('');
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceNewQr = async () => {
    try {
      await authFetch('/api/whatsapp/relink', { method: 'POST' });
      setWaStatus({
        connected: false,
        authenticated: false,
        phase: 'initializing',
        qrCode: null,
        myNumber: null,
        initializing: true
      });
      setStatusHint('Nieuwe QR wordt gestart...');
      setChats([]);
      setMessages([]);
      setSelectedChat(null);
      setTimeout(() => {
        fetchWaStatus();
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-knowledge animate-fade-in" style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="font-heading">WhatsApp Inbox & AI Hub</h1>
          <p className="text-muted">Beheer al je gesprekken. De AI assistent reageert automatisch op de achtergrond.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {waStatus.connected && (
            <button className="btn-secondary" onClick={handleForceNewQr} style={{ borderColor: '#25D366', color: '#25D366' }}>
              Nieuwe QR
            </button>
          )}
          {waStatus.connected && (
            <button className="btn-secondary" onClick={handleDisconnect} style={{ color: '#EF4444', borderColor: '#EF4444' }}>
              Verbinding verbreken
            </button>
          )}
          <button className="btn-secondary" onClick={() => setShowSettings(!showSettings)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> AI Instellingen
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>🤖 Wie mag de AI antwoorden?</h3>
            <select 
              value={aiSettings.targetAudience}
              onChange={(e) => saveSettings({ ...aiSettings, targetAudience: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', marginBottom: '1rem' }}
            >
              <option value="all">Iedereen (Alle inkomende berichten)</option>
              <option value="new">Alleen nieuwe klanten (Eerste contact)</option>
              <option value="none">Niemand (Zet AI op pauze)</option>
            </select>

            <h3 style={{ marginBottom: '1rem', marginTop: '1rem' }}>📅 Agenda Integratie</h3>
            <button 
              className={aiSettings.calendarConnected ? "btn-secondary" : "btn-primary"}
              onClick={() => {
                alert("Google/Apple Calendar integratie vereist OAuth setup. Dit komt in fase 2!");
                saveSettings({ ...aiSettings, calendarConnected: true });
              }}
              style={{ width: '100%' }}
            >
              {aiSettings.calendarConnected ? "✅ Agenda is gekoppeld" : "Koppel Google/Apple Calendar"}
            </button>
          </div>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>🧠 Kennisbank (Wat weet de AI?)</h3>
            <textarea 
              value={aiSettings.knowledge}
              onChange={(e) => saveSettings({ ...aiSettings, knowledge: e.target.value })}
              placeholder="Bijv. Wij zijn een webshop. Verzendkosten zijn €5. Bestellingen voor 22:00 worden morgen geleverd..."
              style={{ width: '100%', height: '120px', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', resize: 'none' }}
            />
          </div>
        </div>
      )}

      {!backendReachable && (
        <div className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #EF4444', color: '#FCA5A5' }}>
          Backend niet bereikbaar op <code>{API_BASE}</code>. Start de server eerst om QR en chats te laden.
        </div>
      )}

      {statusHint && (
        <div className="glass-panel" style={{ marginBottom: '1rem', padding: '0.85rem 1rem', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#FDE68A' }}>
          {statusHint}
        </div>
      )}

      {!waStatus.connected && backendReachable && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '1rem', padding: '1.25rem', border: '1px solid #25D366', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(16,185,129,0.04))' }}>
          <div style={{ minWidth: '220px' }}>
            <h3 style={{ margin: 0, marginBottom: '0.4rem' }}>Scan met WhatsApp</h3>
            {waStatus.authenticated || waStatus.phase === 'finalizing' ? (
              <p style={{ margin: 0, color: '#86EFAC', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> QR gescand. Even geduld, we maken alles klaar...
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ga naar "Gekoppelde apparaten" en scan deze QR-code.
              </p>
            )}
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={fetchWaStatus}>
                QR vernieuwen
              </button>
              <button className="btn-secondary" onClick={handleForceNewQr}>
                Nieuwe QR forceren
              </button>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '0.75rem', minHeight: '220px', minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(16,185,129,0.18)' }}>
            {waStatus.qrCode ? (
              <img src={waStatus.qrCode} alt="WhatsApp QR" width="210" height="210" style={{ maxWidth: '100%', height: 'auto' }} />
            ) : waStatus.authenticated || waStatus.phase === 'finalizing' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#065F46', textAlign: 'center', padding: '10px' }}>
                <CheckCircle2 size={42} />
                <strong>QR geaccepteerd</strong>
                <span style={{ fontSize: '0.85rem' }}>Even geduld, we laden je chats...</span>
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : waStatus.initializing ? (
              <p style={{ color: 'black', margin: 0 }}>WhatsApp initialiseren...</p>
            ) : (
              <p style={{ color: 'black', margin: 0 }}>QR laden...</p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar: Chats List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Recente Chats</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={fetchChats} 
                  disabled={isLoadingChats}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Vernieuwen"
                >
                  <Clock size={16} className={isLoadingChats ? "animate-spin" : ""} />
                </button>
                {waStatus.connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                    <CheckCircle2 size={14} /> Verbonden
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#FBBF24', background: 'rgba(251, 191, 36, 0.12)', padding: '4px 8px', borderRadius: '12px' }}>
                    <Bell size={14} /> Offline cache
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {isLoadingChats ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chats laden...</div>
            ) : chats.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {waStatus.connected ? 'Geen chats gevonden.' : 'Nog geen opgeslagen chats gevonden. Verbind WhatsApp om te synchroniseren.'}
              </div>
            ) : (
              chats.map((chat) => {
                const chatName = chat.name || chat.phoneNumber || 'Onbekend contact';
                const fallbackInitial = chatName.trim().charAt(0).toUpperCase() || '?';

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: '1px solid var(--glass-border)',
                      transition: 'all 0.2s ease',
                      background: selectedChat?.id === chat.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chatName}
                          style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                          {fallbackInitial}
                        </div>
                      )}
                      {chat.unreadCount > 0 && (
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#25D366', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', border: '2px solid #1a1a1a' }}>
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(chat.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chat.id === waStatus.myNumber ? 'Jezelf (Test de AI hier!)' : 'Tik om chat te openen'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main: Chat View */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                {selectedChat.avatar ? (
                  <img
                    src={selectedChat.avatar}
                    alt={getChatDisplayName(selectedChat)}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <User size={20} />
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0 }}>{getChatDisplayName(selectedChat)}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getChatPhoneLabel(selectedChat)}</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn-secondary" onClick={handleResyncMessages} disabled={isLoadingMessages}>
                    Historie verversen
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isLoadingMessages ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Berichten laden...</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.fromMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        background: msg.fromMe ? '#005C4B' : 'var(--bg-surface-hover)', 
                        padding: '10px 14px', 
                        borderRadius: '12px',
                        borderBottomRightRadius: msg.fromMe ? '4px' : '12px',
                        borderBottomLeftRadius: !msg.fromMe ? '4px' : '12px',
                        color: 'var(--text-main)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.body}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: msg.fromMe ? 'flex-end' : 'flex-start', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {formatTime(msg.timestamp)}
                        {msg.fromMe && <Check size={12} color="#53BDEB" />}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Typ een bericht..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                  />
                  <button 
                    onClick={handleSend} 
                    disabled={!input.trim()}
                    style={{ background: '#10B981', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, transition: 'all 0.2s' }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h2>WhatsApp Web & AI</h2>
              <p>Selecteer een chat om berichten te bekijken.</p>
              <p style={{ fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                De AI Assistent leest automatisch mee op de achtergrond en beantwoordt je klanten op basis van jouw bedrijfsdata.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default WhatsAppAgent;
