import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from '@/contexts/AuthContext';

const authSchema = z.object({
  email: z.string().email("Email tidak valid").max(255),
  password: z.string().min(6, "Password minimal 6 karakter").max(100),
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupLat, setSignupLat] = useState<string | number>("");
  const [signupLng, setSignupLng] = useState<string | number>("");
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = authSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validated.email, password: validated.password })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        const msg = body?.error || (body?.message) || 'Login gagal';
        toast({ title: 'Login Gagal', description: msg, variant: 'destructive' });
        return;
      }

      // store token then navigate
      const token = body.token || body.data?.token;
      if (token) {
        try { localStorage.setItem('auth_token', token); } catch (e) { /* ignore storage errors */ }
      }

      // update auth context if user payload returned
      let dest = '/';
      if (body.user) {
        setUser(body.user);
        const role = (body.user.role || '').toString().toLowerCase();
        if (role === 'customer') dest = '/customer';
        else if (role === 'admin') dest = '/dashboard';
        else if (role === 'courier') dest = '/courier';
      }

      toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
      navigate(dest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: 'Validasi Gagal', description: error.errors[0].message, variant: 'destructive' });
      } else {
        console.error('Login error', error);
        toast({ title: 'Error', description: (error as any)?.message || 'Terjadi kesalahan', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = authSchema.parse({
        email: signupEmail,
        password: signupPassword,
        fullName: signupFullName
      });

      // Basic client-side validation for coordinates to avoid server DB precision errors
      const tryParseCoord = (v: string | number) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = Number(v);
        if (Number.isNaN(n)) return NaN;
        return n;
      };

      const latNum = tryParseCoord(signupLat as any);
      const lngNum = tryParseCoord(signupLng as any);

      if (latNum !== undefined && Number.isNaN(latNum)) {
        toast({ title: 'Validasi Gagal', description: 'Latitude tidak valid', variant: 'destructive' });
        return;
      }
      if (lngNum !== undefined && Number.isNaN(lngNum)) {
        toast({ title: 'Validasi Gagal', description: 'Longitude tidak valid', variant: 'destructive' });
        return;
      }
      if (latNum !== undefined && (latNum < -90 || latNum > 90)) {
        toast({ title: 'Validasi Gagal', description: 'Latitude harus di antara -90 dan 90', variant: 'destructive' });
        return;
      }
      if (lngNum !== undefined && (lngNum < -180 || lngNum > 180)) {
        toast({ title: 'Validasi Gagal', description: 'Longitude harus di antara -180 dan 180', variant: 'destructive' });
        return;
      }

      setIsLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validated.email,
          password: validated.password,
          full_name: validated.fullName,
          customer_name: validated.fullName,
          address: signupAddress || null,
          phone: signupPhone || null,
          lat: latNum !== undefined ? Number(latNum.toFixed(6)) : undefined,
          lng: lngNum !== undefined ? Number(lngNum.toFixed(6)) : undefined
        })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        const msg = body?.error || 'Pendaftaran gagal';
        toast({ title: 'Pendaftaran Gagal', description: msg, variant: 'destructive' });
        return;
      }

      // store token if returned
      const token = body.token || body.data?.token;
      if (token) {
        try { localStorage.setItem('auth_token', token); } catch (e) { }
      }

      if (body.user) {
        setUser(body.user);
        const role = (body.user.role || '').toString().toLowerCase();
        const dest = role === 'customer' ? '/customer' : role === 'admin' ? '/dashboard' : role === 'courier' ? '/courier' : '/';
        toast({ title: 'Pendaftaran Berhasil', description: 'Akun Anda berhasil dibuat.' });
        navigate(dest);
      } else {
        toast({ title: 'Pendaftaran Berhasil', description: 'Akun Anda berhasil dibuat.' });
        navigate('/');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: 'Validasi Gagal', description: error.errors[0].message, variant: 'destructive' });
      } else {
        console.error('Signup error', error);
        toast({ title: 'Error', description: (error as any)?.message || 'Terjadi kesalahan', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl gradient-primary">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogistiX
            </h1>
          </div>
          <p className="text-muted-foreground">Sistem Manajemen Logistik Modern</p>
        </div>

        <Card className="shadow-elegant border-none hover-lift">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="nama@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Masuk"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama Lengkap</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telepon</Label>
                    <Input
                      id="signup-phone"
                      type="text"
                      placeholder="0812xxxx"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-address">Alamat</Label>
                    <Input
                      id="signup-address"
                      type="text"
                      placeholder="Jalan contoh No.1"
                      value={signupAddress}
                      onChange={(e) => setSignupAddress(e.target.value)}
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="signup-lat">Latitude</Label>
                      <Input
                        id="signup-lat"
                        type="number"
                        step="0.000001"
                        placeholder="-7.0"
                        value={signupLat as any}
                        onChange={(e) => setSignupLat(e.target.value)}
                        disabled={isLoading}
                        className="border-2 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lng">Longitude</Label>
                      <Input
                        id="signup-lng"
                        type="number"
                        step="0.000001"
                        placeholder="112.0"
                        value={signupLng as any}
                        onChange={(e) => setSignupLng(e.target.value)}
                        disabled={isLoading}
                        className="border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nama@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-2 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Daftar Sekarang"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;