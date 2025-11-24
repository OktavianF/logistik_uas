import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  user_id?: number;
  role?: string;
  username?: string;
} | null;

type AuthContextType = {
  user: User;
  setUser: (u: User) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {}
});

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const body = await res.json();
        const u = body?.data || body?.user || null;
        setUser(u);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('Failed to fetch auth user', err);
      }
    };

    fetchUser();
  }, []);

  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
