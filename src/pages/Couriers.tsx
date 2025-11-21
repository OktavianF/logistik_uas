import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Courier {
  courier_id: number;
  name: string;
  phone: string;
  region: string;
}

const Couriers = () => {
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    region: ""
  });

  const normalizeCourierRow = (r: any): Courier => ({
    courier_id: r.COURIER_ID ?? r.courier_id,
    name: r.NAME ?? r.name,
    phone: r.PHONE ?? r.phone,
    region: r.REGION ?? r.region
  });

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = { "Cache-Control": "no-cache" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/couriers`, { cache: "no-store", headers });
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        setCouriers(body.data.map(normalizeCourierRow));
      } else {
        throw new Error(body.error || 'Invalid response');
      }
    } catch (err: any) {
      console.error('Failed fetching couriers', err);
      toast({ title: 'Error', description: `Gagal memuat kurir: ${err.message || err}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/couriers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const body = await res.json();
      if (body.success && body.data) {
        setCouriers(prev => [...prev, normalizeCourierRow(body.data)]);
        setIsDialogOpen(false);
        setFormData({ name: '', phone: '', region: '' });
        toast({ title: 'Berhasil', description: 'Kurir berhasil ditambahkan' });
      } else {
        throw new Error(body.error || 'Create failed');
      }
    } catch (err: any) {
      console.error('Create courier failed', err);
      toast({ title: 'Error', description: `Gagal menambah kurir: ${err.message || err}` });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kurir ini?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/couriers/${id}`, { method: 'DELETE', headers });
      const body = await res.json();
      if (body.success) {
        setCouriers(prev => prev.filter(c => c.courier_id !== id));
        toast({ title: 'Berhasil', description: 'Kurir berhasil dihapus', variant: 'destructive' });
      } else {
        throw new Error(body.error || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Delete courier failed', err);
      toast({ title: 'Error', description: `Gagal menghapus kurir: ${err.message || err}` });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kurir
            </h1>
            <p className="text-muted-foreground text-lg">Kelola data kurir</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Kurir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kurir Baru</DialogTitle>
                <DialogDescription>
                  Isi formulir di bawah untuk menambah kurir
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Kurir</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="region">Wilayah</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Daftar Kurir
              </CardTitle>
              <CardDescription>{loading ? 'Memuat...' : `Total ${couriers.length} kurir terdaftar`}</CardDescription>
            </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couriers.map((courier) => (
                  <TableRow key={courier.courier_id}>
                    <TableCell className="font-medium">{courier.courier_id}</TableCell>
                    <TableCell>{courier.name}</TableCell>
                    <TableCell>{courier.phone}</TableCell>
                    <TableCell>{courier.region}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(courier.courier_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Couriers;
