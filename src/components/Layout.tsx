import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Truck, Package, MapPin, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = () => {
const location = useLocation();
const navigate = useNavigate();
const [user, setUser] = useState<any>(null);

  const parseJwt = (token?: string | null) => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      // base64url -> base64
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const payload = parseJwt(token);
    if (payload) setUser(payload);
  }, []);

  const signOut = () => {
    try {
      localStorage.removeItem('auth_token');
    } catch (e) {}
    setUser(null);
    navigate('/auth');
  };

  // Derive role from token payload (same logic used for displayName)
  const role = user?.role || user?.roles || user?.role_name || null;

  // Navigation per role:
  // - courier -> only Tugas Pengiriman (/courier)
  // - customer -> only Tracking (/tracking)
  // - others (admin) -> full menu
  const navItems = role === 'courier'
    ? [ { icon: Truck, label: 'Tugas Pengiriman', path: '/courier' } ]
    : role === 'customer'
      ? [
          { icon: Package, label: 'Pengiriman', path: '/customer' },
          { icon: MapPin, label: 'Tracking', path: '/tracking' }
        ]
      : [
          { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
          { icon: Users, label: "Pelanggan", path: "/customers" },
          { icon: Truck, label: "Kurir", path: "/couriers" },
          { icon: Package, label: "Pengiriman", path: "/shipments" },
          { icon: MapPin, label: "Tracking", path: "/tracking" }
        ];

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <aside className="w-64 bg-sidebar shadow-elegant">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2 rounded-xl gradient-primary">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">LogistiX</h1>
              <p className="text-xs text-sidebar-foreground/60">Sistem Logistik</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          </div>
        
        <div className="p-6 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                    <div className="flex flex-col items-start">
                      {(() => {
                        // Derive a localized role label from token payload
                        const role = user?.role || user?.roles || user?.role_name || null;
                        const roleLabel = role === 'admin' ? 'Admin' : role === 'courier' ? 'Kurir' : role === 'customer' ? 'Pelanggan' : 'User';
                        const displayName = user?.user_metadata?.full_name || user?.name || roleLabel;
                        const subtitle = user?.email || roleLabel;
                        return (
                          <>
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-sidebar-foreground/60">{subtitle}</span>
                          </>
                        );
                      })()}
                    </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <main className="flex-1 overflow-auto gradient-subtle animate-fade-in p-6">
      <Outlet />
      </main>
    </div>
  );
};

export default Layout;
