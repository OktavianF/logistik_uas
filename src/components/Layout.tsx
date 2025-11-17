import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Truck, Package, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
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
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default Layout;
