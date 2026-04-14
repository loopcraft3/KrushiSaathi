// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  _id: string;
  name: string;
  username: string;
  role: 'farmer' | 'vendor';
  place?: string;
  land_area?: number;
  farmer_type?: string;
  village?: string;
  phone?: string;
  aadhaar?: string;
  email?: string;
  crops_grown?: string[];
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  isLoading: true,
});

// ── Helper: fetch full user from /api/auth/me ─────────────────────────────────
async function fetchFreshUser(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // handles both { data: user } and plain user object
    return json.data ?? json;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore session and ALWAYS fetch fresh user from server
  useEffect(() => {
    const savedToken = localStorage.getItem('krushi_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    // Fetch fresh user instead of trusting potentially stale localStorage
    fetchFreshUser(savedToken).then(freshUser => {
      if (freshUser) {
        setUser(freshUser);
        // Keep localStorage in sync with fresh data
        localStorage.setItem('krushi_user', JSON.stringify(freshUser));
      } else {
        // Token expired or invalid — clear session
        localStorage.removeItem('krushi_token');
        localStorage.removeItem('krushi_user');
        setToken(null);
      }
      setIsLoading(false);
    });
  }, []);

  // login — saves token, then fetches fresh user from server immediately
  const login = async (userData: User, userToken: string) => {
    setToken(userToken);
    localStorage.setItem('krushi_token', userToken);

    // Always fetch fresh user after login so all profile fields are present
    const freshUser = await fetchFreshUser(userToken);
    const finalUser = freshUser ?? userData; // fallback to login response if fetch fails

    setUser(finalUser);
    localStorage.setItem('krushi_user', JSON.stringify(finalUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('krushi_token');
    localStorage.removeItem('krushi_user');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Update failed');

    // After update, fetch fresh user to ensure everything is in sync
    const freshUser = await fetchFreshUser(token);
    const updated = freshUser ?? (json.data ?? json);

    setUser(updated);
    localStorage.setItem('krushi_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);