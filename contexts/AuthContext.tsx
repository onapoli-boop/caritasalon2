import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, nom: string, isOwner: boolean) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Écouter les changements d'auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );
    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile) || null);
  };

  const signUp = async (email: string, password: string, nom: string, isOwner: boolean) => {
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError || !newUser) {
        return { error: signUpError?.message || 'Erreur lors de l\'inscription' };
      }

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          email,
          nom,
          is_owner: isOwner,
        });

      if (profileError) {
        return { error: profileError.message };
      }

      setUser(newUser);
      await fetchProfile(newUser.id);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erreur inconnue' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { user: signedInUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !signedInUser) {
        return { error: error?.message || 'Erreur de connexion' };
      }

      setUser(signedInUser);
      await fetchProfile(signedInUser.id);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erreur inconnue' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
