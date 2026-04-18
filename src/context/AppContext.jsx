import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasSupabaseConfig, supabase, supabaseConfigMessage } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [assistantConfig, setAssistantConfig] = useState(null);
  const [theme, setTheme] = useState('dark-mode');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [knowledgeBase, setKnowledgeBase] = useState({
    urls: [],
    files: []
  });

  // Listen to auth state changes
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setUser(null);
      setAuthLoading(false);
      return undefined;
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.className = theme;
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
      supabaseConfigured: hasSupabaseConfig,
      supabaseConfigMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
