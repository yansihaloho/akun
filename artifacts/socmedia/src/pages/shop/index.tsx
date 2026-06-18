import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ShopLayout from "@/components/layout/ShopLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Tag, Package, TrendingUp, ShieldCheck } from "lucide-react";

type Product = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  totalSold: number;
  warrantyDays: number;
  platform: string;
  category: string | null;
  isActive: boolean;
};


const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
};

function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {product.category && (
        <div className="px-4 pt-3 pb-0">
          <span className="text-xs font-semibold text-orange-500">{product.category}</span>
        </div>
      )}

      <div className="p-4 flex gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-3 mb-1.5">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
          )}
        </div>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        {!product.imageUrl && (
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${PLATFORM_COLORS[product.platform] ?? "bg-gray-100 text-gray-500"}`}>
            <span className="text-xs font-bold">{product.platform === "facebook" ? "FB" : product.platform === "instagram" ? "IG" : "??"}</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-gray-400" /> Harga</span>
          <span className="font-bold text-gray-900">{formatRupiah(product.price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1"><Package className="w-3 h-3 text-gray-400" /> Stok</span>
          <span className={product.stock === 0 ? "text-red-500 font-medium" : "font-medium"}>{product.stock === 0 ? "Habis" : product.stock}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-gray-400" /> Terjual</span>
          <span className="font-medium">{product.totalSold.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-gray-400" /> Garansi</span>
          <span className="font-medium">{product.warrantyDays} Hari</span>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs font-medium text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          onClick={() => setLocation(`/shop/produk/${product.id}`)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Lihat Detail
        </Button>
        <Button
          size="sm"
          className="flex-1 h-9 text-xs font-medium bg-indigo-600 hover:bg-indigo-700"
          disabled={product.stock === 0}
          onClick={() => setLocation(`/shop/checkout/${product.id}`)}
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
          Beli Sekarang
        </Button>
      </div>
    </div>
  );
}

export default function ShopIndex() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["shop-products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
  });

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q);
    const matchPlatform = platform === "all" || p.platform === platform;
    return matchSearch && matchPlatform;
  });

  return (
    <ShopLayout showSearch onSearch={setSearch}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Toko Akun</h1>
        <p className="text-gray-500 text-sm mt-1">Akun Facebook &amp; Instagram berkualitas terpercaya</p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: "all", label: "Semua" },
          { value: "facebook", label: "Facebook" },
          { value: "instagram", label: "Instagram" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPlatform(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              platform === tab.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tidak ada produk ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </ShopLayout>
  );
}
