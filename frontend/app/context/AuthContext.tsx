"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
type User = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  profile?: {
    avatar?: string;
    display_name?: string;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        // console.log({ refresh: res.data.payload });
        setUser(res.data.payload);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
