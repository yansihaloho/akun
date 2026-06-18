import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import AccountDetail from "@/pages/account-detail";
import Login from "@/pages/login";
import ShopIndex from "@/pages/shop/index";
import ProductDetail from "@/pages/shop/product";
import Checkout from "@/pages/shop/checkout";
import OrderStatus from "@/pages/shop/order-status";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminSettings from "@/pages/admin/settings";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setAuthed(true);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memuat...</p>
        </div>
      </div>
    );
  }
  if (!authed) return null;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Public shop routes — no auth required */}
      <Route path="/shop" component={ShopIndex} />
      <Route path="/shop/produk/:id" component={ProductDetail} />
      <Route path="/shop/checkout/:id" component={Checkout} />
      <Route path="/shop/cek-pesanan" component={OrderStatus} />

      {/* Admin routes — auth required */}
      <Route path="/">
        <AdminRoute><Dashboard /></AdminRoute>
      </Route>
      <Route path="/accounts">
        <AdminRoute><Accounts /></AdminRoute>
      </Route>
      <Route path="/accounts/:id">
        <AdminRoute><AccountDetail /></AdminRoute>
      </Route>
      <Route path="/admin/products">
        <AdminRoute><AdminProducts /></AdminRoute>
      </Route>
      <Route path="/admin/orders">
        <AdminRoute><AdminOrders /></AdminRoute>
      </Route>
      <Route path="/admin/settings">
        <AdminRoute><AdminSettings /></AdminRoute>
      </Route>

      <Route>
        <AdminRoute><NotFound /></AdminRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
