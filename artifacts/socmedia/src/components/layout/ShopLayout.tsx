import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Globe, ShoppingBag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ShopLayoutProps {
  children: ReactNode;
  onSearch?: (q: string) => void;
  showSearch?: boolean;
}

export default function ShopLayout({ children, onSearch, showSearch }: ShopLayoutProps) {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/shop" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm hidden sm:inline">SocMedia Shop</span>
          </Link>

          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-8 pr-3 h-8 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </form>
          )}

          <div className="ml-auto flex items-center gap-2">
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} SocMedia Shop · Semua transaksi terjamin aman
      </footer>
    </div>
  );
}
