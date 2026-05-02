import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ADMIN_EMAIL = "admin@gymflow.com";
const ADMIN_PASSWORD = "mullahusen99";
const STORAGE_KEY = "gymflow-admin-auth";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminEmail: string | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email === ADMIN_EMAIL && parsed?.authenticated) {
          setIsAuthenticated(true);
          setAdminEmail(parsed.email);
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      return { success: false, error: "Invalid admin credentials" };
    }
    if (password !== ADMIN_PASSWORD) {
      return { success: false, error: "Invalid admin credentials" };
    }
    setIsAuthenticated(true);
    setAdminEmail(ADMIN_EMAIL);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: ADMIN_EMAIL, authenticated: true }));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAdminEmail(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0d12]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminEmail, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
