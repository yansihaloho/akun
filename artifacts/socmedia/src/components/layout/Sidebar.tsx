import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, LogOut, Globe, X, Package, ShoppingBag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type ShopStats = { pendingOrders: number };

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();

  const { data: shopStats } = useQuery<ShopStats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats", { credentials: "include" }).then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const pendingOrders = shopStats?.pendingOrders ?? 0;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/accounts", label: "Akun", icon: Users, badge: 0 },
    { href: "/admin/products", label: "Produk", icon: Package, badge: 0 },
    { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag, badge: pendingOrders },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings, badge: 0 },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">SocMedia Ops</p>
          <p className="text-xs text-sidebar-foreground/50 leading-tight">Admin Panel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors p-1"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <Link
          href="/shop"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors mb-1"
          onClick={onClose}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          Lihat Toko (User)
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
