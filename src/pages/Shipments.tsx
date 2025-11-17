import { useEffect, useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Shipment {
  shipment_id: number;
  tracking_number: string;
  customer_name: string;
  courier_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  service_type: string;
  shipping_date: string;
  delivery_estimate: number;
  delivery_status: string;
}

const Shipments = () => {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeRow = (row: Record<string, any>) => {
    const obj: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      obj[k.toLowerCase()] = v;
    });
    return obj;
  };

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/shipments', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          const mapped = body.data.map((r: any) => {
            const row = normalizeRow(r);
            return {
              shipment_id: row.shipment_id || row.shipmentid || row.id || 0,
              tracking_number: row.tracking_number || row.tracking || "-",
              customer_name: row.customer_name || "-",
              courier_name: row.courier_name || "-",
              origin: row.origin || "-",
              destination: row.destination || "-",
              distance_km: row.distance_km || 0,
              service_type: row.service_type || "-",
              shipping_date: row.shipping_date || row.shippingdate || "-",
              delivery_estimate: row.delivery_estimate || row.deliveryestimate || 0,
              delivery_status: row.delivery_status || row.delivery_status || "-"
            } as Shipment;
          });
          setShipments(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch shipments', err);
        toast({ title: 'Gagal mengambil data pengiriman', description: String(err) });
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();

    // delayed re-fetch to reduce chance of stale view from intermediate caching
    const t = setTimeout(fetchShipments, 2000);
    return () => clearTimeout(t);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      "Dikirim": { className: "bg-info text-info-foreground" },
      "Diproses": { className: "bg-warning text-warning-foreground" },
      "Terkirim": { className: "bg-success text-success-foreground" }
    };
    return variants[status] || variants["Diproses"];
  };

  const filteredShipments = shipments.filter(s =>
    s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pengiriman
            </h1>
            <p className="text-muted-foreground text-lg">Kelola data pengiriman paket</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4" />
                Buat Pengiriman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Pengiriman Baru</DialogTitle>
                <DialogDescription>
                  Isi formulir untuk membuat pengiriman baru
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Pelanggan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">PT. Maju Jaya</SelectItem>
                        <SelectItem value="2">CV. Berkah Sentosa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Kurir</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kurir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ahmad Rizki</SelectItem>
                        <SelectItem value="2">Budi Santoso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Asal</Label>
                    <Input placeholder="Kota asal" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tujuan</Label>
                    <Input placeholder="Kota tujuan" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Jarak (km)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Jenis Layanan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reguler">Reguler</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Buat Pengiriman</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-elegant border-none">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Cari Pengiriman
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor resi atau nama pelanggan..."
                className="pl-10 border-2 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <div>Memuat daftar pengiriman...</div>}
              {!loading && filteredShipments.map((shipment) => (
                <Card key={shipment.shipment_id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{shipment.tracking_number}</h3>
                          <Badge {...getStatusBadge(shipment.delivery_status)}>
                            {shipment.delivery_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Pelanggan:</strong> {shipment.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Kurir:</strong> {shipment.courier_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Rute:</strong> {shipment.origin} → {shipment.destination} ({shipment.distance_km} km)
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{shipment.service_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Estimasi: {shipment.delivery_estimate} hari
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {shipment.shipping_date}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Shipments;
