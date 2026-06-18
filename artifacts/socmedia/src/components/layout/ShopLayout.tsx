import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Globe, ShoppingBag, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

type QrisSettings = {
  image: string | null;
  accountName: string;
  whatsapp?: string;
};

type StoreProfile = {
  storeName: string;
  tagline: string;
  logo: string | null;
  primaryColor: string;
  bannerText: string;
};

interface ShopLayoutProps {
  children: ReactNode;
  onSearch?: (q: string) => void;
  showSearch?: boolean;
}

export default function ShopLayout({ children, onSearch, showSearch }: ShopLayoutProps) {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();

  const { data: qris } = useQuery<QrisSettings>({
    queryKey: ["qris-settings"],
    queryFn: () => fetch("/api/settings/qris").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const { data: profile } = useQuery<StoreProfile>({
    queryKey: ["store-profile"],
    queryFn: () => fetch("/api/settings/store-profile").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const primaryColor = profile?.primaryColor ?? "#4f46e5";
  const storeName = profile?.storeName ?? "SocMedia Shop";

  const handleSearchChange = (value: string) => {
    setQ(value);
    if (onSearch) onSearch(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top navbar ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/shop" className="flex items-center gap-2 flex-shrink-0">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt={storeName}
                className="w-8 h-8 rounded-lg object-contain"
                style={{ background: `${primaryColor}22` }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Globe className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-gray-900 text-sm hidden sm:inline">{storeName}</span>
          </Link>

          {showSearch && (
            <form className="flex-1 max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-8 pr-3 h-8 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                />
              </div>
            </form>
          )}

          <div className="ml-auto flex items-center gap-2">
            {qris?.whatsapp && (
              <a
                href={`https://wa.me/${qris.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md border border-green-300 text-green-700 text-xs font-medium hover:bg-green-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Hubungi Admin
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setLocation("/shop/cek-pesanan")}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              <span>Cek Pesanan</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Store banner ────────────────────────────────────────────────────── */}
      {profile && (
        <div
          className="w-full"
          style={{ background: `linear-gradient(135deg, ${primaryColor}f0, ${primaryColor}b0)` }}
        >
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={storeName}
                className="w-14 h-14 rounded-2xl object-contain bg-white/20 p-1.5 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Store className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-white text-lg leading-tight">{storeName}</h1>
              {profile.tagline && (
                <p className="text-white/80 text-sm mt-0.5 line-clamp-2">{profile.tagline}</p>
              )}
            </div>
          </div>

          {profile.bannerText && (
            <div className="bg-black/20">
              <div className="max-w-6xl mx-auto px-4 py-2">
                <p className="text-white/90 text-xs text-center">{profile.bannerText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {storeName} · Semua transaksi terjamin aman
        {qris?.whatsapp && (
          <span className="ml-2">
            ·{" "}
            <a
              href={`https://wa.me/${qris.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: primaryColor }}
            >
              Hubungi Admin
            </a>
          </span>
        )}
      </footer>
    </div>
  );
}
