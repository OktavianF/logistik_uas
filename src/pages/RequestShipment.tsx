import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string,string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/customers', { headers, cache: 'no-store' });
        if (!res.ok) return;
        const body = await res.json();
        const data = Array.isArray(body?.data) ? body.data[0] : body?.data;
        if (!data) return;
        const address = data.ADDRESS ?? data.address ?? '';
        const lat = data.LAT ?? data.lat ?? data.latitude ?? '';
        const lng = data.LNG ?? data.lng ?? data.longitude ?? '';
        if (address) setPickupAddress(address);
        if (lat !== undefined && lat !== null) setPickupLat(lat);
        if (lng !== undefined && lng !== null) setPickupLng(lng);
      } catch (err) {
        console.warn('Failed to load customer data', err);
      }
    };

    loadCustomer();
  }, []);

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
            {/* Pickup fields removed from form UI - values are sourced from customer's record */}


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
