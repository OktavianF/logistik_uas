import { useState } from "react";
import { Search, Package, MapPin, Clock, CheckCircle2, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Tracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setShipmentData({
        tracking_number: trackingNumber,
        customer_name: "John Doe",
        origin: "Jakarta",
        destination: "Surabaya",
        status: "Dikirim",
        courier_name: "Ahmad Kurnia",
        shipping_date: "2024-01-15",
        delivery_estimate: "2024-01-17",
        distance_km: 750,
        service_type: "Express",
        timeline: [
          { status: "Diproses", date: "2024-01-15 08:00", location: "Jakarta" },
          { status: "Dikirim", date: "2024-01-15 14:00", location: "Jakarta" },
          { status: "Transit", date: "2024-01-16 09:00", location: "Semarang" }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Diproses": return "bg-yellow-500";
      case "Dikirim": return "bg-blue-500";
      case "Transit": return "bg-purple-500";
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

            <Card className="shadow-elegant hover-lift border-none">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Timeline Pengiriman
                </CardTitle>
                <CardDescription>Riwayat perjalanan paket Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipmentData.timeline.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${getStatusColor(item.status)}`}>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        {index < shipmentData.timeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{item.status}</span>
                          <Badge variant="outline" className="text-xs">{item.location}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
