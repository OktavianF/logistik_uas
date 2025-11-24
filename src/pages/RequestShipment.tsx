import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function RequestShipment() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<string | number>('');
  const [pickupLng, setPickupLng] = useState<string | number>('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState<string | number>('');
  const [dropoffLng, setDropoffLng] = useState<string | number>('');
  const [serviceType, setServiceType] = useState<'Reguler'|'Express'>('Reguler');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/shipment_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pickup_address: pickupAddress,
          pickup_lat: pickupLat || undefined,
          pickup_lng: pickupLng || undefined,
          dropoff_address: dropoffAddress,
          dropoff_lat: dropoffLat || undefined,
          dropoff_lng: dropoffLng || undefined,
          service_type: serviceType,
          notes
        })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error || 'Gagal membuat permintaan');
      }

      toast({ title: 'Permintaan Dikirim', description: 'Permintaan pengiriman Anda telah dibuat.' });
      navigate('/customer');
    } catch (err: any) {
      console.error('request error', err);
      toast({ title: 'Gagal', description: err?.message || 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Permintaan Pengiriman</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Alamat Penjemputan</Label>
              <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Alamat penjemputan" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Lat (penjemputan)</Label>
                <Input type="number" step="0.000001" value={pickupLat as any} onChange={(e) => setPickupLat(e.target.value)} />
              </div>
              <div>
                <Label>Lng (penjemputan)</Label>
                <Input type="number" step="0.000001" value={pickupLng as any} onChange={(e) => setPickupLng(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Alamat Tujuan</Label>
              <Input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Alamat tujuan" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Lat (tujuan)</Label>
                <Input type="number" step="0.000001" value={dropoffLat as any} onChange={(e) => setDropoffLat(e.target.value)} />
              </div>
              <div>
                <Label>Lng (tujuan)</Label>
                <Input type="number" step="0.000001" value={dropoffLng as any} onChange={(e) => setDropoffLng(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Jenis Layanan</Label>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant={serviceType === 'Reguler' ? undefined : 'ghost'} onClick={() => setServiceType('Reguler')}>Reguler</Button>
                <Button type="button" variant={serviceType === 'Express' ? undefined : 'ghost'} onClick={() => setServiceType('Express')}>Express</Button>
              </div>
            </div>

            <div>
              <Label>Catatan</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instruksi tambahan" />
            </div>

            <div>
              <Button type="submit" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Permintaan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
