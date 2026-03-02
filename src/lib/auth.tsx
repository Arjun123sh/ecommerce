import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/api/axios";
import { supabase } from "@/integrations/supabase/client";

export interface Address {
  _id: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  token: string;
  addresses?: Address[];
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === 'admin');
      } catch (error) {
        console.error('Failed to parse stored user info');
      }
    }
    setLoading(false);
  }, []);



  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);

      const { data } = await api.post('/auth/register', { name: fullName, email, password });
      setUser(data);
      setIsAdmin(data.role === 'admin');
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.message || 'Registration failed') };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data);
      setIsAdmin(data.role === 'admin');
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.message || 'Invalid email or password') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
