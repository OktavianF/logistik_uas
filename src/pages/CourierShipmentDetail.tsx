import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TrackingMap from '@/components/TrackingMap';

interface ShipmentDetail {
  SHIPMENT_ID: number;
  TRACKING_NUMBER: string;
  ORIGIN: string;
  DESTINATION: string;
  DELIVERY_STATUS: string;
  DELIVERY_ESTIMATE: string;
  CUSTOMER_NAME: string;
  CUSTOMER_ADDRESS: string;
  CUSTOMER_PHONE: string;
  status_history: Array<{
    OLD_STATUS: string;
    NEW_STATUS: string;
    UPDATED_AT: string;
  }>;
}

export default function CourierShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!roleLoading && role !== 'courier') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`/api/shipments/${id}`, { headers });
        const data = await response.json();

        if (data.success) {
          setShipment(data.data);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat detail pengiriman',
          variant: 'destructive',
        });
        navigate('/courier');
      } finally {
        setLoading(false);
      }
    };

    if (role === 'courier' && id) {
      fetchShipment();
    }
  }, [id, role, navigate, toast]);

  const updateStatus = async (newStatus: string) => {
    if (!shipment) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/shipments/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus, notes }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Status pengiriman diperbarui',
        });
        setShipment({ ...shipment, DELIVERY_STATUS: newStatus });
        setNotes('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!shipment) return null;

  const canPickup = shipment.DELIVERY_STATUS === 'Diproses';
  const canDeliver = shipment.DELIVERY_STATUS === 'Dalam Pengiriman';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/courier')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{shipment.TRACKING_NUMBER}</CardTitle>
              <CardDescription>Detail Pengiriman</CardDescription>
            </div>
            <Badge>{shipment.DELIVERY_STATUS}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Informasi Pelanggan</h3>
                <p className="text-sm">Nama: {shipment.CUSTOMER_NAME}</p>
                <p className="text-sm">Alamat: {shipment.CUSTOMER_ADDRESS}</p>
                <p className="text-sm">Telepon: {shipment.CUSTOMER_PHONE}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Detail Rute</h3>
                <p className="text-sm">Asal: {shipment.ORIGIN}</p>
                <p className="text-sm">Tujuan: {shipment.DESTINATION}</p>
                <p className="text-sm">
                  ETA: {new Date(shipment.DELIVERY_ESTIMATE).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Timeline Status</h3>
              <div className="space-y-3">
                {shipment.status_history?.map((history, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary p-1">
                        <Clock className="h-3 w-3 text-primary-foreground" />
                      </div>
                      {idx < shipment.status_history.length - 1 && (
                        <div className="w-0.5 h-8 bg-border" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{history.NEW_STATUS}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(history.UPDATED_AT).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Aksi Pengiriman</h3>
            <Textarea
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />

            <div className="flex gap-3">
              {canPickup && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1" disabled={updating}>
                      <Package className="mr-2 h-4 w-4" />
                      Ambil Paket
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Pengambilan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin telah mengambil paket ini? Status akan diubah menjadi "Dalam Pengiriman".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateStatus('Dalam Pengiriman')}>
                        Ya, Ambil Paket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canDeliver && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1" disabled={updating}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Tandai Terkirim
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Pengiriman</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin paket ini telah dikirim ke pelanggan? Status akan diubah menjadi "Terkirim".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateStatus('Terkirim')}>
                        Ya, Sudah Terkirim
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}