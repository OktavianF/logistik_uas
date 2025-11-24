import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Array<{ customer_id: number; name: string; address?: string; lat?: number; lng?: number }>>([]);
  const [couriersList, setCouriersList] = useState<Array<{ courier_id: number; name: string }>>([]);

  const [formValues, setFormValues] = useState({
    customer_id: '',
    courier_id: '',
    // origin is fixed to Lamongan on submit; do not expose as input
    destination: '',
    dest_lat: '' as string | number,
    dest_lng: '' as string | number,
    distance_km: '',
    service_type: ''
  });

  const normalizeRow = (row: Record<string, any>) => {
    const obj: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      obj[k.toLowerCase()] = v;
    });
    return obj;
  };

  // When a customer is selected, auto-fill destination and coordinates from customer record
  useEffect(() => {
    if (!formValues.customer_id || formValues.customer_id === '-1') return;
    const cust = customers.find(c => String(c.customer_id) === String(formValues.customer_id));
    if (cust) {
      setFormValues(prev => ({
        ...prev,
        destination: cust.address ?? cust.name ?? '',
        dest_lat: cust.lat ?? '',
        dest_lng: cust.lng ?? ''
      }));
    }
  }, [formValues.customer_id, customers]);

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/shipments', { cache: 'no-store', headers });
        if (res.status === 401) {
          // not authenticated or token invalid — redirect to login
          navigate('/auth');
          return;
        }
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

    // also fetch lists used by the create form
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/customers', { cache: 'no-store', headers });
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          setCustomers(body.data.map((c: any) => ({
            customer_id: c.CUSTOMER_ID ?? c.customer_id,
            name: c.NAME ?? c.name ?? c.email,
            address: c.ADDRESS ?? c.address,
            lat: c.LAT ?? c.lat,
            lng: c.LNG ?? c.lng
          })));
        }
      } catch (err) {
        console.warn('Failed to fetch customers for form', err);
      }
    };

    const fetchCouriersList = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/couriers', { cache: 'no-store', headers });
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          setCouriersList(body.data.map((c: any) => ({ courier_id: c.COURIER_ID ?? c.courier_id, name: c.NAME ?? c.name })));
        }
      } catch (err) {
        console.warn('Failed to fetch couriers for form', err);
      }
    };

    fetchShipments();
    fetchCustomers();
    fetchCouriersList();

    // delayed re-fetch to reduce chance of stale view from intermediate caching
    const t = setTimeout(fetchShipments, 2000);
    return () => clearTimeout(t);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (!formValues.customer_id || formValues.customer_id === '-1') {
        toast({ title: 'Error', description: 'Pilih pelanggan terlebih dahulu', variant: 'destructive' });
        return;
      }

      const courierIdNum = formValues.courier_id && formValues.courier_id !== '-1' ? Number(formValues.courier_id) : null;

      const payload = {
        customer_id: Number(formValues.customer_id),
        courier_id: courierIdNum,
        origin: 'Lamongan',
        destination: formValues.destination,
        distance_km: Number(formValues.distance_km) || 0,
        service_type: formValues.service_type || 'Reguler'
      };

      const res = await fetch('/api/shipments', { method: 'POST', headers, body: JSON.stringify(payload) });
      const body = await res.json();
      if (body && body.success) {
        toast({ title: 'Berhasil', description: 'Pengiriman dibuat' });
        setIsDialogOpen(false);
        // reset form
        setFormValues({ customer_id: '', courier_id: '', destination: '', dest_lat: '', dest_lng: '', distance_km: '', service_type: '' });
        // refresh list
        const fetchRes = await fetch('/api/shipments', { cache: 'no-store', headers });
        const fetchBody = await fetchRes.json();
        if (fetchBody && fetchBody.success && Array.isArray(fetchBody.data)) {
          setShipments(fetchBody.data.map((r: any) => {
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
          }));
        }
      } else {
        throw new Error(body.error || 'Create failed');
      }
    } catch (err: any) {
      console.error('Create shipment failed', err);
      toast({ title: 'Error', description: `Gagal membuat pengiriman: ${err.message || err}` });
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      "Dalam Pengiriman": { className: "bg-info text-info-foreground" },
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
                    <Label htmlFor="customer">Pelanggan</Label>
                    <Select
                      value={formValues.customer_id}
                      onValueChange={(v) => setFormValues({ ...formValues, customer_id: v })}
                    >
                      <SelectTrigger id="customer">
                        <SelectValue placeholder="Pilih pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 && <SelectItem value="-1" disabled>Tidak ada pelanggan</SelectItem>}
                        {customers.map(c => (
                          <SelectItem key={c.customer_id} value={String(c.customer_id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courier">Kurir</Label>
                    <Select
                      value={formValues.courier_id}
                      onValueChange={(v) => setFormValues({ ...formValues, courier_id: v })}
                    >
                      <SelectTrigger id="courier">
                        <SelectValue placeholder="Pilih kurir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1" disabled>(Pilih kosong jika belum ditentukan)</SelectItem>
                        {couriersList.map(c => (
                          <SelectItem key={c.courier_id} value={String(c.courier_id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Origin is fixed to Lamongan and destination is auto-filled from selected customer; no inputs shown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Jarak (km)</Label>
                    <Input type="number" placeholder="0" value={formValues.distance_km} onChange={(e) => setFormValues({ ...formValues, distance_km: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Jenis Layanan</Label>
                    <Select value={formValues.service_type} onValueChange={(v) => setFormValues({ ...formValues, service_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reguler">Reguler</SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateSubmit}>Buat Pengiriman</Button>
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
