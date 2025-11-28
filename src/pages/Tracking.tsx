import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, MapPin, Clock, CheckCircle2, Truck, Map } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import TrackingMap from "@/components/TrackingMap";

const Tracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Masukkan nomor resi terlebih dahulu");
      return;
    }
    
    setLoading(true);
    setShipmentData(null);

    try {
      // Call backend API (include auth token if present)
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/shipments/track/${trackingNumber}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const result = await response.json();

      if (response.status === 401) {
        toast.error("Anda harus masuk untuk melacak paket");
        navigate('/auth');
        setLoading(false);
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(result.error || "Gagal melacak paket");
        setLoading(false);
        return;
      }

      const data = result.data;

      // Transform data for UI
      setShipmentData({
        tracking_number: data.tracking_number,
        customer_name: data.customer_name,
        origin: data.origin.name,
        destination: data.destination.name,
        status: data.current.status,
        courier_name: data.courier_name,
        shipping_date: data.shipping_date,
        delivery_estimate: data.delivery_estimate,
        distance_km: data.distance_km,
        service_type: data.service_type,
        timeline: data.route.map((r: any) => ({
          status: r.status,
          date: new Date(r.timestamp).toLocaleString('id-ID'),
          location: r.location || data.origin.name
        })),
        // Map data
        mapData: {
          origin: data.origin,
          destination: data.destination,
          current: data.current,
          route: data.route
        }
      });

      toast.success("Data tracking berhasil dimuat");
    } catch (error) {
      console.error("Error tracking shipment:", error);
      toast.error("Terjadi kesalahan saat melacak paket");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Diproses": return "bg-yellow-500";
      case "Dalam Pengiriman": return "bg-purple-500";
      case "Terkirim": return "bg-green-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Real-time Tracking
          </h1>
          <p className="text-muted-foreground text-lg">Lacak paket Anda secara real-time dengan nomor resi</p>
        </div>

        <Card className="shadow-elegant border-none">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Masukkan Nomor Resi
            </CardTitle>
            <CardDescription>
              Ketik nomor resi pengiriman untuk melihat status terkini
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: TRK2024010001"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="flex-1 border-2 focus:border-primary transition-colors"
              />
              <Button 
                onClick={handleTrack} 
                disabled={loading}
                className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Mencari..." : "Lacak"}
              </Button>
            </div>
          </CardContent>
        </Card>


        {loading && (
          <Card className="shadow-elegant border-none">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        )}

        {shipmentData && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-elegant hover-lift border-none">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Detail Pengiriman
                  </CardTitle>
                  <Badge className={`${getStatusColor(shipmentData.status)} shadow-md`}>
                    {shipmentData.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Nomor Resi:</span>
                      <span className="font-medium text-foreground">{shipmentData.tracking_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Asal:</span>
                      <span className="font-medium text-foreground">{shipmentData.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tujuan:</span>
                      <span className="font-medium text-foreground">{shipmentData.destination}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Kurir:</span>
                      <span className="font-medium text-foreground">{shipmentData.courier_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estimasi Tiba:</span>
                      <span className="font-medium text-foreground">{shipmentData.delivery_estimate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Layanan:</span>
                      <span className="font-medium text-foreground">{shipmentData.service_type}</span>
                    </div>
                  </div>
                </div>
                </CardContent>
            </Card>

            {/* Interactive Map */}
            <Card className="shadow-elegant hover-lift border-none">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  Peta Pelacakan Real-time
                </CardTitle>
                <CardDescription>Visualisasi rute dan posisi paket saat ini</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {shipmentData.mapData && (
                  <TrackingMap
                    origin={shipmentData.mapData.origin}
                    destination={shipmentData.mapData.destination}
                    current={shipmentData.mapData.current}
                    route={shipmentData.mapData.route}
                  />
                )}
              </CardContent>
            </Card>

            {/* Timeline Pengiriman section removed per request */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
