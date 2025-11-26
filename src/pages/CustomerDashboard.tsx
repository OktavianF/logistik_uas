import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Plus, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shipment {
  SHIPMENT_ID: number;
  TRACKING_NUMBER: string;
  ORIGIN?: string;
  DESTINATION?: string;
  DELIVERY_STATUS?: string;
  DELIVERY_ESTIMATE?: string | number;
  SERVICE_TYPE?: string;
  [key: string]: any;
}

export default function CustomerDashboard() {
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const userAny = user as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== 'customer') {
      navigate('/dashboard');
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki akses ke halaman ini',
        variant: 'destructive',
      });
    }
  }, [role, roleLoading, navigate, toast]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        // Fetch shipments for current customer (backend should use owner_user_id from token)
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/shipments', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const data = await response.json();

        if (data.success) {
          setShipments(data.data);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat pengiriman',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (role === 'customer') {
      fetchShipments();
    }
  }, [role, toast]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
      'Diproses': 'secondary',
      'Dalam Pengiriman': 'default',
      'Terkirim': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatEta = (shipment: any) => {
    const est = shipment.DELIVERY_ESTIMATE ?? shipment.delivery_estimate ?? shipment.deliveryestimate ?? 0;
    const sd = shipment.SHIPPING_DATE ?? shipment.shipping_date ?? shipment.shippingdate ?? shipment.shippingDate ?? null;
    const days = Number(est);
    if (!sd || !days) return '—';
    const shipDate = new Date(sd);
    if (isNaN(shipDate.getTime())) return '—';
    const eta = new Date(shipDate.getTime() + days * 24 * 60 * 60 * 1000);
    return eta.toLocaleDateString('id-ID');
  };

  if (roleLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Pengiriman Saya</h1>
          <p className="text-muted-foreground">Kelola dan lacak pengiriman Anda</p>
        </div>
        {/* <Button onClick={() => navigate('/customer/request')}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Permintaan
        </Button> */}
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">Belum ada pengiriman</p>
            <Button onClick={() => navigate('/customer/request')}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Permintaan Pengiriman
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <Card key={shipment.SHIPMENT_ID} className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-extrabold">{shipment.TRACKING_NUMBER}</CardTitle>
                    <CardDescription>Detail Pengiriman</CardDescription>
                  </div>
                  {getStatusBadge(shipment.DELIVERY_STATUS)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Informasi Pelanggan</h3>
                    <p className="mb-1"><span className="font-medium">Nama:</span> {shipment.CUSTOMER_NAME ?? shipment.customer_name ?? (userAny?.name || userAny?.user_metadata?.full_name || '—')}</p>
                    <p className="mb-1"><span className="font-medium">Alamat:</span> {shipment.CUSTOMER_ADDRESS ?? shipment.customer_address ?? shipment.CUSTOMER_ADDRESS ?? '—'}</p>
                    <p className="mb-1"><span className="font-medium">Telepon:</span> {shipment.CUSTOMER_PHONE ?? shipment.customer_phone ?? shipment.PHONE ?? '—'}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Detail Rute</h3>
                    <p className="mb-1"><span className="font-medium">Asal:</span> {shipment.ORIGIN ?? shipment.origin ?? '—'}</p>
                    <p className="mb-1"><span className="font-medium">Tujuan:</span> {shipment.DESTINATION ?? shipment.destination ?? '—'}</p>
                    <p className="mb-1"><span className="font-medium">ETA:</span> {formatEta(shipment)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => navigate(`/tracking`)}
                    className="w-full"
                    variant="outline"
                  >
                    Lihat Detail & Lacak
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}