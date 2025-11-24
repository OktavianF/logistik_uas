import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TrackingMap from '@/components/TrackingMap';

interface TrackingResult {
  tracking_number: string;
  delivery_status: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  current: { lat: number; lng: number; timestamp: string; status: string };
  route: Array<{ lat: number; lng: number; timestamp: string; status: string }>;
}

export default function PublicTracking() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Masukkan nomor resi',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/shipments/track/${trackingNumber}`);
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Tidak Ditemukan',
        description: 'Nomor resi tidak ditemukan',
        variant: 'destructive',
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle py-12">
      <div className="container mx-auto px-6 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold gradient-text">Lacak Pengiriman</h1>
          <p className="text-lg text-muted-foreground">
            Masukkan nomor resi untuk melacak status pengiriman Anda
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cari Pengiriman
            </CardTitle>
            <CardDescription>Nomor resi format: TRKXXXXXXXXXX</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">Nomor Resi</Label>
                <Input
                  id="tracking"
                  placeholder="Contoh: TRK2024010001"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Mencari...' : 'Lacak Sekarang'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-fade-in">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{result.tracking_number}</CardTitle>
                    <CardDescription>Status Pengiriman</CardDescription>
                  </div>
                  <Badge className="text-base">{result.delivery_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Asal</p>
                      <p className="text-sm text-muted-foreground">{result.origin.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Tujuan</p>
                      <p className="text-sm text-muted-foreground">{result.destination.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Status Terakhir</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.current.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Peta Pelacakan Real-time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <TrackingMap
                    route={result.route}
                    origin={result.origin}
                    destination={result.destination}
                    current={result.current}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}