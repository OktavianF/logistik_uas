import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  customer_id: number;
  name: string;
  address: string;
  phone: string;
}

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const normalizeCustomerRow = (r: any): Customer => ({
    customer_id: r.CUSTOMER_ID ?? r.customer_id,
    name: r.NAME ?? r.name,
    address: r.ADDRESS ?? r.address,
    phone: r.PHONE ?? r.phone
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = { "Cache-Control": "no-cache" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/customers`, { cache: "no-store", headers });
      const body = await res.json();
      if (res.status === 401) {
        // Unauthorized — redirect to login
        toast({ title: 'Unauthorized', description: 'Silakan login kembali', variant: 'destructive' });
        navigate('/auth');
        return;
      }

      if (body.success && Array.isArray(body.data)) {
        setCustomers(body.data.map(normalizeCustomerRow));
      } else {
        throw new Error(body.error || "Invalid response");
      }
    } catch (err: any) {
      console.error("Failed fetching customers", err);
      toast({ title: "Error", description: `Gagal memuat pelanggan: ${err.message || err}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      const body = await res.json();
      if (res.status === 401) {
        toast({ title: 'Unauthorized', description: 'Silakan login kembali', variant: 'destructive' });
        navigate('/auth');
        return;
      }

      if (body.success && body.data) {
        setCustomers(prev => [...prev, normalizeCustomerRow(body.data)]);
        setIsDialogOpen(false);
        setFormData({ name: "", address: "", phone: "" });
        toast({ title: "Berhasil", description: "Pelanggan berhasil ditambahkan" });
      } else {
        throw new Error(body.error || 'Create failed');
      }
    } catch (err: any) {
      console.error("Create customer failed", err);
      toast({ title: "Error", description: `Gagal menambah pelanggan: ${err.message || err}` });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pelanggan ini?")) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE", headers });
      const body = await res.json();
      if (body.success) {
        setCustomers(prev => prev.filter(c => c.customer_id !== id));
        toast({ title: "Berhasil", description: "Pelanggan berhasil dihapus", variant: "destructive" });
      } else {
        throw new Error(body.error || 'Delete failed');
      }
    } catch (err: any) {
      console.error("Delete customer failed", err);
      toast({ title: "Error", description: `Gagal menghapus pelanggan: ${err.message || err}` });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pelanggan
            </h1>
            <p className="text-muted-foreground text-lg">Kelola data pelanggan</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4" />
                Tambah Pelanggan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                <DialogDescription>
                  Isi formulir di bawah untuk menambah pelanggan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Pelanggan</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                <Users className="h-5 w-5 text-primary" />
                Daftar Pelanggan
              </CardTitle>
              <CardDescription>{loading ? 'Memuat...' : `Total ${customers.length} pelanggan terdaftar`}</CardDescription>
            </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">{customer.customer_id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-2" onClick={() => {
                        setEditingId(customer.customer_id);
                        setFormData({ name: customer.name, address: customer.address, phone: customer.phone });
                        setIsEditOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.customer_id)}
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
        {/* Edit Customer Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pelanggan</DialogTitle>
              <DialogDescription>Perbarui data pelanggan lalu simpan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editingId) return;
              try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                const headers: Record<string,string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`/api/customers/${editingId}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({ name: formData.name, address: formData.address, phone: formData.phone })
                });
                const body = await res.json();
                if (body.success) {
                  setCustomers(prev => prev.map(c => c.customer_id === editingId ? { ...c, name: formData.name, address: formData.address, phone: formData.phone } : c));
                  setIsEditOpen(false);
                  setEditingId(null);
                  toast({ title: 'Berhasil', description: 'Perubahan disimpan' });
                } else {
                  throw new Error(body.error || 'Update failed');
                }
              } catch (err: any) {
                console.error('Update customer failed', err);
                toast({ title: 'Error', description: `Gagal menyimpan perubahan: ${err.message || err}` });
              }
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nama Pelanggan</Label>
                  <Input id="edit-name" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-address">Alamat</Label>
                  <Input id="edit-address" value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Nomor Telepon</Label>
                  <Input id="edit-phone" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Customers;
