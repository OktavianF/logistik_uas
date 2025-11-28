import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Courier {
  COURIER_ID?: number;
  courier_id?: number;
  NAME?: string;
  name?: string;
}

export default function AdminReportPerCourier() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string,string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/couriers', { headers });
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          setCouriers(body.data);
        }
      } catch (err) {
        console.warn('Failed to load couriers', err);
      }
    };
    fetchCouriers();
  }, []);

  const generate = async () => {
    if (!selectedCourier) {
      toast({ title: 'Pilih kurir', description: 'Silakan pilih kurir untuk laporan', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string,string> = { 'Cache-Control': 'no-cache' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const qs = new URLSearchParams();
      qs.set('courier_id', selectedCourier);
      if (startDate) qs.set('start_date', startDate);
      if (endDate) qs.set('end_date', endDate);

      const res = await fetch('/api/reports/per-courier?' + qs.toString(), { headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Request failed');
      }
      const body = await res.json();
      if (!body.success) throw new Error(body.error || 'Failed to generate report');
      setReport(body.data);
    } catch (err: any) {
      console.error('Generate report failed', err);
      toast({ title: 'Error', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const csvEscape = (value: string) => {
    if (value == null) return '';
    const s = String(value);
    if (s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) return '"' + s + '"';
    return s;
  };

  const objectArrayToCSV = (rows: Array<Record<string, any>>) => {
    if (!rows || rows.length === 0) return '';
    // collect all keys in stable order
    const keySet = new Set<string>();
    rows.forEach(r => Object.keys(r).forEach(k => keySet.add(k)));
    const keys = Array.from(keySet);
    const header = keys.join(',');
    const lines = rows.map(r => keys.map(k => csvEscape(r[k] ?? '')).join(','));
    return [header, ...lines].join('\n');
  };

  const downloadCSV = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSummaryCSV = () => {
    if (!report || !report.summary) return;
    const rows = report.summary;
    const csv = objectArrayToCSV(rows.map((r: any) => {
      // normalize keys to readable header
      const normalized: Record<string, any> = {};
      Object.entries(r).forEach(([k,v]) => normalized[k] = v);
      return normalized;
    }));
    const filename = `report_summary_courier_${selectedCourier || 'all'}_${Date.now()}.csv`;
    downloadCSV(filename, csv);
  };

  const exportDetailsCSV = () => {
    if (!report || !report.details) return;
    const rows = report.details;
    const csv = objectArrayToCSV(rows.map((r: any) => {
      const normalized: Record<string, any> = {};
      Object.entries(r).forEach(([k,v]) => normalized[k] = v);
      return normalized;
    }));
    const filename = `report_details_courier_${selectedCourier || 'all'}_${Date.now()}.csv`;
    downloadCSV(filename, csv);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan Per Kurir</h1>
          <p className="text-muted-foreground">Pilih kurir dan rentang tanggal untuk menghasilkan laporan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parameter Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Kurir</label>
                <Select value={selectedCourier} onValueChange={(v) => setSelectedCourier(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    {couriers.map((c) => (
                      <SelectItem key={String(c.COURIER_ID ?? c.courier_id)} value={String(c.COURIER_ID ?? c.courier_id)}>{c.NAME ?? c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Mulai (YYYY-MM-DD)</label>
                <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="2025-01-01" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Sampai (YYYY-MM-DD)</label>
                <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="2025-12-31" />
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={generate} disabled={loading}>{loading ? 'Memproses...' : 'Generate Laporan'}</Button>
            </div>
          </CardContent>
        </Card>

        {report && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={exportSummaryCSV} variant="outline">Export Summary CSV</Button>
              <Button onClick={exportDetailsCSV} variant="outline">Export Details CSV</Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(report.summary && report.summary[0]) ? (
                    Object.entries(report.summary[0]).map(([k,v]) => (
                      <div key={k} className="p-3 border rounded"> 
                        <div className="text-xs text-muted-foreground">{k}</div>
                        <div className="text-lg font-semibold">{String(v)}</div>
                      </div>
                    ))
                  ) : (
                    <div>Ringkasan tidak tersedia</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.details && report.details.length > 0 ? (
                    report.details.map((d: any) => (
                      <div key={d.SHIPMENT_ID || d.shipment_id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <div className="font-medium">{d.TRACKING_NUMBER ?? d.tracking_number}</div>
                          <div className="text-sm text-muted-foreground">{d.CUSTOMER_NAME ?? d.customer_name} — {d.ORIGIN ?? d.origin} → {d.DESTINATION ?? d.destination}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{d.SHIPPING_DATE ?? d.shipping_date} • {d.DELIVERY_STATUS ?? d.delivery_status}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Tidak ada data detail</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
