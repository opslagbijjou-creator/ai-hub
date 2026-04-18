import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasSupabaseConfig, supabase, supabaseConfigMessage } from '../lib/supabase';
import { hasApiBaseConfig, apiConfigMessage } from '../lib/api';

const AppContext = createContext();
const DEFAULT_ADMIN_UIDS = ['77b79572-27b4-4f2d-ad4d-0cc8a27ea8d3'];
const CONFIGURED_ADMIN_UIDS = (import.meta.env.VITE_ADMIN_UIDS || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const ADMIN_UIDS = Array.from(new Set([...DEFAULT_ADMIN_UIDS, ...CONFIGURED_ADMIN_UIDS]));

export const AppProvider = ({ children }) => {
  const [assistantConfig, setAssistantConfig] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light-mode';
    return localStorage.getItem('theme') || 'light-mode';
  });
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => hasSupabaseConfig);
  const isAdmin = Boolean(user?.id && ADMIN_UIDS.includes(user.id));
  
  const [knowledgeBase, setKnowledgeBase] = useState({
    urls: [],
    files: []
  });

  const parseOAuthHashSession = () => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  };

  const clearOAuthUrlArtifacts = () => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    let changed = false;

    if (url.hash) {
      url.hash = '';
      changed = true;
    }

    ['code', 'error', 'error_description', 'state'].forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });

    if (changed) {
      const search = url.searchParams.toString();
      const cleanPath = search ? `${url.pathname}?${search}` : url.pathname;
      window.history.replaceState({}, document.title, cleanPath);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    if (!hasSupabaseConfig) return undefined;

    let mounted = true;

    const bootstrapSession = async () => {
      try {
        const oauthSession = parseOAuthHashSession();
        if (oauthSession) {
          await supabase.auth.setSession({
            access_token: oauthSession.accessToken,
            refresh_token: oauthSession.refreshToken
          });
          clearOAuthUrlArtifacts();
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setUser(session?.user ?? null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    bootstrapSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        clearOAuthUrlArtifacts();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark-mode' ? 'light-mode' : 'dark-mode');
  };

  const signOut = async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setAssistantConfig(null);
  };

  return (
    <AppContext.Provider value={{ 
      assistantConfig, setAssistantConfig, 
      theme, toggleTheme,
      knowledgeBase, setKnowledgeBase,
      user, authLoading, signOut,
      isAdmin,
      supabaseConfigured: hasSupabaseConfig,
      supabaseConfigMessage,
      apiConfigured: hasApiBaseConfig,
      apiConfigMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
