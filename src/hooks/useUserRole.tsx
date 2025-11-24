import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'courier' | 'customer' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          setRole(null);
        } else {
          const body = await res.json();
          // backend returns { success: true, data: { user ... } } or similar
          const user = body?.data || body?.user || body;
          setRole(user?.role || null);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, loading };
};