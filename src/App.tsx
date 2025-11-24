import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Couriers from "./pages/Couriers";
import Auth from "./pages/Auth";
import Shipments from "./pages/Shipments";
import Tracking from "./pages/Tracking";
import ProtectedRoute from "./components/ProtectedRoute";
import CourierDashboard from "./pages/CourierDashboard";
import CourierShipmentDetail from "./pages/CourierShipmentDetail";
import CustomerDashboard from "./pages/CustomerDashboard";
import NewShipment from "./pages/NewShipment";
import RequestShipment from "./pages/RequestShipment";
import CustomerShipmentDetail from "./pages/CustomerShipmentDetail";
import PublicTracking from "./pages/PublicTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/track" element={<PublicTracking />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute allowedRoles={["admin"]}><Customers /></ProtectedRoute>} />
              <Route path="/couriers" element={<ProtectedRoute allowedRoles={["admin"]}><Couriers /></ProtectedRoute>} />
              <Route path="/shipments" element={<ProtectedRoute allowedRoles={["admin"]}><Shipments /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute allowedRoles={["admin"]}><Tracking /></ProtectedRoute>} />
              <Route path="/courier" element={<ProtectedRoute allowedRoles={["courier"]}><CourierDashboard /></ProtectedRoute>} />
              <Route path="/courier/shipments/:id" element={<ProtectedRoute allowedRoles={["courier"]}><CourierShipmentDetail /></ProtectedRoute>} />
              <Route path="/customer" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer/new" element={<ProtectedRoute allowedRoles={["customer"]}><NewShipment /></ProtectedRoute>} />
              <Route path="/customer/request" element={<ProtectedRoute allowedRoles={["customer"]}><RequestShipment /></ProtectedRoute>} />
              <Route path="/customer/shipments/:id" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerShipmentDetail /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
