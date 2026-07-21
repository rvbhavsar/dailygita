import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AuthResponse, Profile, User } from 'shared';
import { ApiError, apiGet, apiSend } from '@/lib/api';

export type { Profile, User };

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signUp: (email: string, password: string, displayName?: string, age?: number, profession?: string, maritalStatus?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  confirmPasswordReset: (token: string, password: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (data: { display_name: string; selectedChallenges: string[]; dailyEmailEnabled: boolean }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toError = (e: unknown): Error =>
  e instanceof ApiError || e instanceof Error ? e : new Error('Something went wrong');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The session lives in an httpOnly cookie, so the only way to learn who we
  // are is to ask the server. This replaces getSession + onAuthStateChange.
  useEffect(() => {
    apiGet<AuthResponse>('/auth/me')
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => {
        setUser(null);
        setProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    age?: number,
    profession?: string,
    maritalStatus?: string,
  ) => {
    try {
      const data = await apiSend<AuthResponse>('POST', '/auth/signup', {
        email,
        password,
        displayName,
        age,
        profession,
        maritalStatus,
      });
      setUser(data.user);
      setProfile(data.profile);
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiSend<AuthResponse>('POST', '/auth/login', { email, password });
      setUser(data.user);
      setProfile(data.profile);
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const signOut = async () => {
    await apiSend('POST', '/auth/logout').catch(() => undefined);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await apiSend('POST', '/auth/password/reset-request', { email });
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      await apiSend('POST', '/auth/password/reset-confirm', { token, password });
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiSend('PATCH', '/auth/password', { currentPassword, newPassword });
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const updated = await apiSend<Profile>('PATCH', '/profile', updates);
      setProfile(updated);
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const refreshProfile = useCallback(async () => {
    try {
      const data = await apiGet<AuthResponse>('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      /* stale session; the route guards handle the redirect */
    }
  }, []);

  const completeOnboarding = async (data: {
    display_name: string;
    selectedChallenges: string[];
    dailyEmailEnabled: boolean;
  }) => {
    try {
      const updated = await apiSend<Profile>('POST', '/profile/onboarding', {
        display_name: data.display_name,
        selected_challenges: data.selectedChallenges,
        daily_verse_enabled: data.dailyEmailEnabled,
      });
      setProfile(updated);
      return { error: null };
    } catch (e) {
      return { error: toError(e) };
    }
  };

  const isOnboarded = profile?.is_onboarded ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isOnboarded,
        signUp,
        signIn,
        signOut,
        resetPassword,
        confirmPasswordReset,
        updatePassword,
        updateProfile,
        refreshProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
