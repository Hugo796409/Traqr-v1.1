"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem("demo_user");
    if (demoUser) {
      try {
        setUser(JSON.parse(demoUser));
      } catch (err) {
        // Ignore parse errors
      }
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      if (!email || email.length < 3) {
        throw new Error("Email invalide");
      }
      if (!password || password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }
      // Demo: Store user in localStorage
      const demoUser = {
        uid: `user_${Date.now()}`,
        email,
        displayName: email.split("@")[0],
      };
      setUser(demoUser);
      localStorage.setItem("demo_user", JSON.stringify(demoUser));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      if (!email || email.length < 3) {
        throw new Error("Email invalide");
      }
      if (!password || password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }
      // Demo: Store user in localStorage
      const demoUser = {
        uid: `user_${Date.now()}`,
        email,
        displayName: email.split("@")[0],
      };
      setUser(demoUser);
      localStorage.setItem("demo_user", JSON.stringify(demoUser));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setUser(null);
      localStorage.removeItem("demo_user");
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
