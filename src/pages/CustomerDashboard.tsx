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
  ORIGIN: string;
  DESTINATION: string;
  DELIVERY_STATUS: string;
  DELIVERY_ESTIMATE: string;
  SERVICE_TYPE: string;
}

export default function CustomerDashboard() {
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
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
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'Diproses': 'secondary',
      'Dalam Pengiriman': 'default',
      'Terkirim': 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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
        <Button onClick={() => navigate('/customer/request')}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Permintaan
        </Button>
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
                    <CardTitle className="text-xl">{shipment.TRACKING_NUMBER}</CardTitle>
                    <CardDescription>{shipment.SERVICE_TYPE}</CardDescription>
                  </div>
                  {getStatusBadge(shipment.DELIVERY_STATUS)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{shipment.ORIGIN}</span> → <span className="font-medium">{shipment.DESTINATION}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      ETA: {new Date(shipment.DELIVERY_ESTIMATE).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <Button
                    onClick={() => navigate(`/customer/shipments/${shipment.SHIPMENT_ID}`)}
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