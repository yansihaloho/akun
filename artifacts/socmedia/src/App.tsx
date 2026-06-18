import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import AccountDetail from "@/pages/account-detail";
import Login from "@/pages/login";
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

  if (!checked) return null;
  if (!authed) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AuthGuard>
          <Layout>
            <Dashboard />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/accounts">
        <AuthGuard>
          <Layout>
            <Accounts />
          </Layout>
        </AuthGuard>
      </Route>
      <Route path="/accounts/:id">
        <AuthGuard>
          <Layout>
            <AccountDetail />
          </Layout>
        </AuthGuard>
      </Route>
      <Route>
        <AuthGuard>
          <Layout>
            <NotFound />
          </Layout>
        </AuthGuard>
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
