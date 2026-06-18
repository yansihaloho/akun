import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, LogOut, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Akun", icon: Users },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();

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
          <p className="text-xs text-sidebar-foreground/50 leading-tight">Account Manager</p>
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
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
