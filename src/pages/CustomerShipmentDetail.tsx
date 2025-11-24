import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Clock, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TrackingMap from '@/components/TrackingMap';

interface ShipmentDetail {
  SHIPMENT_ID: number;
  TRACKING_NUMBER: string;
  ORIGIN: string;
  DESTINATION: string;
  DELIVERY_STATUS: string;
  DELIVERY_ESTIMATE: string;
  SERVICE_TYPE: string;
  COURIER_NAME?: string;
  COURIER_PHONE?: string;
  status_history: Array<{
    OLD_STATUS: string;
    NEW_STATUS: string;
    UPDATED_AT: string;
  }>;
}

interface TrackingData {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  current: { lat: number; lng: number; timestamp: string; status: string };
  route: Array<{ lat: number; lng: number; timestamp: string; status: string }>;
}

export default function CustomerShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== 'customer') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipmentRes, trackingRes] = await Promise.all([
          fetch(`http://localhost:3000/api/shipments/${id}`),
          fetch(`http://localhost:3000/api/shipments/track/${id}`),
        ]);

        const shipmentData = await shipmentRes.json();
        const tracking = await trackingRes.json();

        if (shipmentData.success) {
          setShipment(shipmentData.data);
        }

        if (tracking.success) {
          setTrackingData(tracking.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat detail pengiriman',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (role === 'customer' && id) {
      fetchData();
    }
  }, [id, role, toast]);

  if (roleLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/customer')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{shipment.TRACKING_NUMBER}</CardTitle>
              <CardDescription>Detail & Pelacakan Pengiriman</CardDescription>
            </div>
            <Badge>{shipment.DELIVERY_STATUS}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Informasi Pengiriman</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">Asal: {shipment.ORIGIN}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">Tujuan: {shipment.DESTINATION}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      ETA: {new Date(shipment.DELIVERY_ESTIMATE).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {shipment.COURIER_NAME && (
                <div>
                  <h3 className="font-semibold mb-2">Informasi Kurir</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm">{shipment.COURIER_NAME}</span>
                    </div>
                    {shipment.COURIER_PHONE && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm">{shipment.COURIER_PHONE}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

          {trackingData && (
            <div>
              <h3 className="font-semibold mb-3">Peta Pelacakan</h3>
              <div className="h-96 rounded-lg overflow-hidden">
                <TrackingMap
                  route={trackingData.route}
                  origin={trackingData.origin}
                  destination={trackingData.destination}
                  current={trackingData.current}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}