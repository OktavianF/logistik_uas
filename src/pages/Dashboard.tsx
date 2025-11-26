import { Package, Truck, Users, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalShipments: '—',
    activeCouriers: '—',
    totalCustomers: '—',
    totalRegions: '—'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/shipments/metrics', { headers });
        if (res.status === 401) {
          navigate('/auth');
          return;
        }
        const body = await res.json();
        if (body && body.success && body.data) {
          setMetrics({
            totalShipments: (body.data.totalShipments || 0).toLocaleString?.() || String(body.data.totalShipments || 0),
            activeCouriers: (body.data.activeCouriers || 0).toLocaleString?.() || String(body.data.activeCouriers || 0),
            totalCustomers: (body.data.totalCustomers || 0).toLocaleString?.() || String(body.data.totalCustomers || 0),
            totalRegions: (body.data.totalRegions || 0).toLocaleString?.() || String(body.data.totalRegions || 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics', err);
      }
    };

    fetchMetrics();
  }, []);

  const stats = [
    { title: 'Total Pengiriman', value: metrics.totalShipments, icon: Package, description: '', color: 'text-primary' },
    { title: 'Kurir Aktif', value: metrics.activeCouriers, icon: Truck, description: '', color: 'text-accent' },
    { title: 'Pelanggan', value: metrics.totalCustomers, icon: Users, description: '', color: 'text-info' },
    { title: 'Wilayah', value: metrics.totalRegions, icon: MapPin, description: '', color: 'text-warning' }
  ];

  type RecentItem = {
    tracking: string;
    customer: string;
    courier: string;
    status: string;
    destination?: string;
  };

  const [recentShipments, setRecentShipments] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeRow = (row: Record<string, any>) => {
    const obj: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      obj[k.toLowerCase()] = v;
    });
    return obj;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/shipments/dashboard', { cache: 'no-store', headers });
        if (res.status === 401) {
          navigate('/auth');
          return;
        }
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          const mapped = body.data.map((r: any) => {
            const row = normalizeRow(r);
            return {
              tracking: row.tracking_number || row.tracking || row.trackingnumber || "-",
              customer: row.customer_name || row.customer || "-",
              courier: row.courier_name || row.courier || "-",
              status: row.delivery_status || row.status || "-",
              destination: row.destination || row.dest || "-"
            } as RecentItem;
          });
          setRecentShipments(mapped.slice(0, 5));
        }
      } catch (err) {
        // keep static fallback if request fails
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    // optional: poll once after 3s in case of very recent DB changes
    const t = setTimeout(fetchDashboard, 3000);
    return () => clearTimeout(t);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant?: "default" | "secondary" | "destructive" | "outline" | "success", className?: string }> = {
      "Dalam Pengiriman": { variant: "default" },
      "Diproses": { variant: "secondary" },
      "Terkirim": { variant: "success" }
    };

    return variants[status] || variants["Diproses"];
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Ringkasan sistem logistik</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover-lift border-none shadow-elegant overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full -mr-16 -mt-16" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-3 rounded-xl gradient-primary shadow-md">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <p className="text-xs text-accent font-medium">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-elegant border-none">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pengiriman Terbaru
            </CardTitle>
            <CardDescription>
              List pengiriman terakhir yang diproses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <div>Memuat pengiriman terbaru...</div>}
              {!loading && recentShipments.map((shipment) => (
                <div
                  key={shipment.tracking}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {shipment.tracking}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.customer}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{shipment.courier}</p>
                      <p className="text-xs text-muted-foreground">{shipment.destination}</p>
                    </div>
                    <Badge {...getStatusBadge(shipment.status)}>
                      {shipment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
