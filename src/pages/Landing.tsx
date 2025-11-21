import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, MapPin, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-logistics.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Logistics hero" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 gradient-primary opacity-60" />
        </div>
        
        <div className="container mx-auto px-4 z-10 text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Solusi Logistik Modern
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Kelola pengiriman, kurir, dan pelanggan Anda dengan sistem manajemen logistik terpadu dan real-time tracking
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary shadow-lg hover:shadow-xl text-lg px-8">
                Mulai Sekarang
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8 border-2 hover:border-primary">
                Lacak Paket
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fitur Unggulan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola bisnis logistik dengan efisien
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Package className="text-white" size={24} />
                </div>
                <CardTitle>Manajemen Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Kelola semua pengiriman dalam satu platform dengan interface yang intuitif dan mudah digunakan
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Truck className="text-white" size={24} />
                </div>
                <CardTitle>Koordinasi Kurir</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Pantau dan kelola kurir Anda secara real-time dengan sistem tracking yang akurat
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <MapPin className="text-white" size={24} />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Lacak posisi paket secara real-time dan berikan transparansi penuh kepada pelanggan
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <CardTitle>Laporan & Analitik</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Dapatkan insight mendalam dengan laporan komprehensif dan visualisasi data yang jelas
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Shield className="text-white" size={24} />
                </div>
                <CardTitle>Keamanan Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Data Anda dilindungi dengan enkripsi tingkat enterprise dan backup otomatis
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-elegant border-none bg-card/50 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Zap className="text-white" size={24} />
                </div>
                <CardTitle>Performa Tinggi</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Sistem yang cepat dan responsif dengan optimasi database Oracle yang canggih
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div className="animate-fade-in">
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-xl opacity-90">Pengiriman Selesai</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-xl opacity-90">Kurir Aktif</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-xl opacity-90">Tingkat Kepuasan</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-subtle">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Siap Memulai?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan bisnis yang sudah mempercayai sistem kami untuk mengelola logistik mereka
          </p>
          <Link to="/auth">
            <Button size="lg" className="gradient-primary shadow-lg hover:shadow-xl text-lg px-12">
              Coba Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Sistem Manajemen Logistik. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;