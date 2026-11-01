"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import api from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  quickLoginAs: (role: "citizen" | "officer" | "reviewer" | "admin") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("aadhirai_token");
    const savedUser = localStorage.getItem("aadhirai_user");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Set user + token from localStorage immediately so ProtectedRoute doesn't flash
        setToken(savedToken);
        setUser(parsedUser);
        // Mark loading done immediately — we already have valid cached session
        setIsLoading(false);
        // Silently refresh user data in background (don't clear session on network error)
        api.get<User>("/auth/me")
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem("aadhirai_user", JSON.stringify(freshUser));
          })
          .catch((err: any) => {
            // Only clear session on explicit 401 (token truly invalid/expired)
            // Don't clear on network errors or timeouts
            if (err?.status === 401) {
              localStorage.removeItem("aadhirai_token");
              localStorage.removeItem("aadhirai_user");
              setToken(null);
              setUser(null);
            }
          });
      } catch {
        // Corrupted localStorage — clear and show login
        localStorage.removeItem("aadhirai_token");
        localStorage.removeItem("aadhirai_user");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("aadhirai_token", newToken);
    localStorage.setItem("aadhirai_user", JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("aadhirai_token");
      localStorage.removeItem("aadhirai_user");
      window.location.href = "/";
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    const roleNames = user.roles.map((r) => r.name.toLowerCase());
    // Admin / super_admin passes all checks
    if (roleNames.includes("admin") || roleNames.includes("super_admin")) return true;
    // Alias: department_admin counts as officer
    if (roleName === "officer" && roleNames.includes("department_admin")) return true;
    return roleNames.includes(roleName.toLowerCase());
  };

  const quickLoginAs = async (role: "citizen" | "officer" | "reviewer" | "admin") => {
    const credentials = {
      citizen: { phone: "+919876543210", password: "Password123!" },
      officer: { phone: "+919876543211", password: "Password123!" },
      reviewer: { phone: "+919876543213", password: "Password123!" },
      admin: { phone: "+919876543212", password: "Password123!" },
    }[role];

    const res = await api.post<{ access_token: string; user: User }>("/auth/login", credentials);
    login(res.access_token, res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole, quickLoginAs }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
