import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Challenge } from '@/types';

interface UserContextType {
  user: User | null;
  isOnboarded: boolean;
  favorites: string[];
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (userData: Omit<User, 'id'>) => void;
  toggleFavorite: (verseId: string) => void;
  isFavorite: (verseId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('dailygita_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('dailygita_favorites');
    return stored ? JSON.parse(stored) : [];
  });

  const isOnboarded = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('dailygita_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dailygita_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('dailygita_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const completeOnboarding = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
    };
    setUser(newUser);
  };

  const toggleFavorite = (verseId: string) => {
    setFavorites((prev) =>
      prev.includes(verseId)
        ? prev.filter((id) => id !== verseId)
        : [...prev, verseId]
    );
  };

  const isFavorite = (verseId: string) => favorites.includes(verseId);

  return (
    <UserContext.Provider
      value={{
        user,
        isOnboarded,
        favorites,
        setUser,
        updateUser,
        completeOnboarding,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
