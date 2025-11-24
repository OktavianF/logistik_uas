import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const shipmentSchema = z.object({
  origin: z.string().min(3, 'Asal minimal 3 karakter'),
  destination: z.string().min(3, 'Tujuan minimal 3 karakter'),
  distance_km: z.number().min(1, 'Jarak harus lebih dari 0 km'),
  service_type: z.enum(['Reguler', 'Express'], { required_error: 'Pilih jenis layanan' }),
});

export default function NewShipment() {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance_km: '',
    service_type: '',
  });
  const [estimate, setEstimate] = useState<{ cost: number; eta: string } | null>(null);

  useEffect(() => {
    if (!roleLoading && role !== 'customer') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  const calculateEstimate = () => {
    if (!formData.distance_km || !formData.service_type) return;

    const distance = parseFloat(formData.distance_km);
    const costPerKm = formData.service_type === 'Express' ? 15000 : 10000;
    const cost = distance * costPerKm;

    const daysToDeliver = formData.service_type === 'Express' ? 2 : 4;
    const eta = new Date();
    eta.setDate(eta.getDate() + daysToDeliver);

    setEstimate({
      cost,
      eta: eta.toLocaleDateString('id-ID'),
    });
  };

  useEffect(() => {
    calculateEstimate();
  }, [formData.distance_km, formData.service_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = shipmentSchema.parse({
        ...formData,
        distance_km: parseFloat(formData.distance_km),
        service_type: formData.service_type as 'Reguler' | 'Express',
      });

      setSubmitting(true);

      // TODO: Get actual customer_id from user profile
      const response = await fetch('http://localhost:3000/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validatedData,
          customer_id: 1, // Placeholder
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: `Pengiriman dibuat dengan nomor resi: ${data.data.tracking_number}`,
        });
        navigate('/customer');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validasi Gagal',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Gagal membuat pengiriman',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (roleLoading) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/customer')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            Buat Pengiriman Baru
          </CardTitle>
          <CardDescription>Isi formulir di bawah untuk membuat pengiriman baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="origin">Asal</Label>
              <Input
                id="origin"
                placeholder="Contoh: Jakarta"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Tujuan</Label>
              <Input
                id="destination"
                placeholder="Contoh: Surabaya"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Jarak (km)</Label>
              <Input
                id="distance"
                type="number"
                placeholder="Contoh: 800"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Jenis Layanan</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reguler">Reguler (4 hari)</SelectItem>
                  <SelectItem value="Express">Express (2 hari)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {estimate && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Estimasi Biaya:</span>
                      <span className="font-bold">Rp {estimate.cost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Estimasi Tiba:</span>
                      <span className="font-bold">{estimate.eta}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Membuat...' : 'Buat Pengiriman'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}