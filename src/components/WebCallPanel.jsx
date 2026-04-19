import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Loader2, Mic, MicOff, PhoneCall, Send, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';
import { normalizeUiError } from '../lib/normalizeError';
import './WebCallPanel.css';

const STAGE_META = {
  idle: { label: 'Idle', hint: 'Klaar voor testgesprek' },
  listening: { label: 'Listening', hint: 'Je microfoon staat aan' },
  thinking: { label: 'Thinking', hint: 'AI verwerkt je vraag' },
  speaking: { label: 'Speaking', hint: 'AI geeft antwoord' }
};

const getRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const WebCallPanel = ({
  title = 'Web Call Test',
  subtitle = 'Praat direct met je AI assistent in de browser.',
  initialAssistantMessage = 'Goedemiddag! Hoe kan ik je vandaag helpen?',
  companyName = 'jouw bedrijf',
  className = '',
  disabled = false
}) => {
  const [stage, setStage] = useState('idle');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: initialAssistantMessage
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const recognitionRef = useRef(null);
  const recognitionTextRef = useRef('');
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const speechRecognitionClass = useMemo(() => getRecognitionClass(), []);
  const speechSupported = Boolean(speechRecognitionClass);

  const pushMessage = useCallback((role, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        role,
        text
      }
    ]);
  }, []);

  const playAudioDataUrl = useCallback(async (audioDataUrl, fallbackText) => {
    if (!audioDataUrl) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(fallbackText || '');
        utterance.lang = 'nl-NL';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    const audio = new Audio(audioDataUrl);
    audioRef.current = audio;

    await new Promise((resolve) => {
      audio.onended = resolve;
      audio.onerror = resolve;
      audio.play().catch(resolve);
    });
  }, []);

  const sendTurn = useCallback(
    async (text) => {
      const cleaned = String(text || '').trim();
      if (!cleaned || busy || disabled) return;

      setError('');
      pushMessage('user', cleaned);
      setBusy(true);
      setStage('thinking');

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Geen actieve sessie gevonden. Log opnieuw in.');
        }

        const response = await fetch(apiUrl('/api/webcall/turn'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            sessionId: sessionId || undefined,
            inputText: cleaned
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Web call test mislukt.');
        }

        const assistantText = payload?.assistantText || 'Ik heb even geen antwoord. Probeer het nog een keer.';
        pushMessage('assistant', assistantText);

        if (payload?.sessionId) {
          setSessionId(payload.sessionId);
        }

        setStage('speaking');
        await playAudioDataUrl(payload?.audioDataUrl || null, assistantText);
        setStage('idle');
      } catch (turnError) {
        setError(normalizeUiError(turnError, 'Onbekende fout tijdens web call test.'));
        setStage('idle');
      } finally {
        setBusy(false);
      }
    },
    [busy, disabled, playAudioDataUrl, pushMessage, sessionId]
  );

  const startListening = useCallback(() => {
    if (!speechSupported || busy || disabled || listening) return;

    const recognition = new speechRecognitionClass();
    recognitionRef.current = recognition;
    recognitionTextRef.current = '';

    recognition.lang = 'nl-NL';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setStage('listening');
      setLiveTranscript('');
      setError('');
    };

    recognition.onerror = (event) => {
      setListening(false);
      setStage('idle');
      setLiveTranscript('');
      if (event?.error !== 'no-speech') {
        setError('Microfoonfout. Check microfoontoegang in je browser.');
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = recognitionTextRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || '';
        if (result.isFinal) {
          finalText += ` ${transcript}`;
        } else {
          interim += ` ${transcript}`;
        }
      }

      recognitionTextRef.current = finalText.trim();
      setLiveTranscript(interim.trim() || recognitionTextRef.current);
    };

    recognition.onend = () => {
      const transcript = recognitionTextRef.current.trim();
      setListening(false);
      setLiveTranscript('');
      setStage('idle');
      if (transcript) {
        sendTurn(transcript);
      }
    };

    recognition.start();
  }, [busy, disabled, listening, sendTurn, speechRecognitionClass, speechSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await sendTurn(text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stageMeta = STAGE_META[stage] || STAGE_META.idle;

  return (
    <div className={`webcall-panel glass-panel ${className}`.trim()}>
      <div className="webcall-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className={`webcall-stage stage-${stage}`}>
          <span>{stageMeta.label}</span>
          <small>{stageMeta.hint}</small>
        </div>
      </div>

      <div className={`webcall-wave wave-${stage}`}>
        <div className="wave-icon">
          {stage === 'thinking' ? <Brain size={20} /> : stage === 'speaking' ? <Volume2 size={20} /> : <PhoneCall size={20} />}
        </div>
        <div className="wave-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="webcall-transcript">
        {messages.map((message) => (
          <div key={message.id} className={`webcall-msg msg-${message.role}`}>
            <strong>{message.role === 'assistant' ? companyName : 'Jij'}</strong>
            <p>{message.text}</p>
          </div>
        ))}

        {liveTranscript && (
          <div className="webcall-msg msg-user draft">
            <strong>Jij (live)</strong>
            <p>{liveTranscript}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && <div className="webcall-error">{error}</div>}

      <div className="webcall-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={listening ? stopListening : startListening}
          disabled={busy || disabled || !speechSupported}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
          {speechSupported ? (listening ? 'Stop luisteren' : 'Praat nu') : 'Spraak niet beschikbaar'}
        </button>

        <form onSubmit={handleSubmit} className="webcall-input-form">
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Typ je testvraag..."
            disabled={busy || disabled}
          />
          <button type="submit" className="btn-primary" disabled={busy || disabled || !inputText.trim()}>
            {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            Verstuur
          </button>
        </form>
      </div>

      {sessionId && (
        <p className="webcall-session-id">
          Web test sessie: <code>{sessionId}</code>
        </p>
      )}
    </div>
  );
};

export default WebCallPanel;
