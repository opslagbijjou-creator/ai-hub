import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasSupabaseConfig, supabase, supabaseConfigMessage } from '../lib/supabase';
import { hasApiBaseConfig, apiConfigMessage } from '../lib/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [assistantConfig, setAssistantConfig] = useState(null);
  const [theme, setTheme] = useState('light-mode');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => hasSupabaseConfig);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [knowledgeBase, setKnowledgeBase] = useState({
    urls: [],
    files: []
  });

  const setStableUser = (nextUser) => {
    setUser((prevUser) => {
      const prevId = prevUser?.id || null;
      const nextId = nextUser?.id || null;

      if (prevId === nextId) {
        return prevUser;
      }

      return nextUser ?? null;
    });
  };

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
        if (mounted) {
          setStableUser(session?.user ?? null);
          if (!session?.user) setIsAdmin(false);
        }
      } catch {
        if (mounted) {
          setStableUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    bootstrapSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setStableUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
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
    document.body.className = 'light-mode';
    localStorage.setItem('theme', 'light-mode');
  }, [theme]);

  const toggleTheme = () => {
    setTheme('light-mode');
  };

  const signOut = async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsAdmin(false);
    setAssistantConfig(null);
  };

  return (
    <AppContext.Provider value={{ 
      assistantConfig, setAssistantConfig, 
      theme, toggleTheme,
      knowledgeBase, setKnowledgeBase,
      user, authLoading, signOut,
      isAdmin, setIsAdmin,
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
