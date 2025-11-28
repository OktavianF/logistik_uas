import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shipment {
  SHIPMENT_ID: number;
  TRACKING_NUMBER: string;
  ORIGIN: string;
  DESTINATION: string;
  DELIVERY_STATUS: string;
  DELIVERY_ESTIMATE: string;
  CUSTOMER_NAME: string;
  CUSTOMER_ADDRESS: string;
}

export default function CourierDashboard() {
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== 'courier') {
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
        // Get courier id from authenticated user when available
        const courierId = (user && ((user.user_id as any) || (user as any).courier_id)) || null;
        if (!courierId) {
          throw new Error('Courier id not available');
        }
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`/api/shipments/courier/${courierId}`, { headers });
        const data = await response.json();

        if (data.success) {
          setShipments(data.data);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat tugas pengiriman',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (role === 'courier') {
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
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Tugas Pengiriman</h1>
        <p className="text-muted-foreground">Kelola pengiriman yang ditugaskan kepada Anda</p>
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Tidak ada tugas pengiriman</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <Card key={shipment.SHIPMENT_ID} className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{shipment.TRACKING_NUMBER}</CardTitle>
                    <CardDescription>{shipment.CUSTOMER_NAME}</CardDescription>
                  </div>
                  {getStatusBadge(shipment.DELIVERY_STATUS)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{shipment.ORIGIN}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{shipment.DESTINATION}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{shipment.CUSTOMER_ADDRESS}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      ETA: {formatEta(shipment)}
                    </span>
                  </div>

                  <Button
                    onClick={() => navigate(`/courier/shipments/${shipment.SHIPMENT_ID}`)}
                    className="w-full"
                  >
                    Buka Detail
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