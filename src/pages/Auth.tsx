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
      if (body.data?.token) {
        try { localStorage.setItem('auth_token', body.data.token); } catch (e) { /* ignore storage errors */ }
      }

      toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
      navigate('/dashboard');
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

      setIsLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validated.email, password: validated.password, fullName: validated.fullName })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        const msg = body?.error || 'Pendaftaran gagal';
        toast({ title: 'Pendaftaran Gagal', description: msg, variant: 'destructive' });
        return;
      }

      // store token if returned
      if (body.data?.token) {
        try { localStorage.setItem('auth_token', body.data.token); } catch (e) { }
      }

      toast({ title: 'Pendaftaran Berhasil', description: 'Akun Anda berhasil dibuat.' });
      // navigate to dashboard after signup
      navigate('/dashboard');
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