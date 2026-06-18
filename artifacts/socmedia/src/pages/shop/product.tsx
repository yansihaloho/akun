import { useQuery } from "@tanstack/react-query";
import { formatRupiah } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import ShopLayout from "@/components/layout/ShopLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft, Tag, Package, TrendingUp, ShieldCheck } from "lucide-react";

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


export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["shop-product", id],
    queryFn: () => fetch(`/api/products/${id}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

  return (
    <ShopLayout>
      <button
        onClick={() => setLocation("/shop")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Toko
      </button>

      {isLoading ? (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-40 mt-4" />
        </div>
      ) : isError || !product ? (
        <div className="text-center py-20 text-gray-400">
          <p>Produk tidak ditemukan</p>
          <Button className="mt-4" onClick={() => setLocation("/shop")}>Kembali ke Toko</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {product.category && (
              <p className="text-xs font-semibold text-orange-500 mb-2">{product.category}</p>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h1>

            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full max-h-48 object-contain rounded-lg border border-gray-100 mb-4"
              />
            )}

            <div className="prose prose-sm text-gray-700 whitespace-pre-line text-sm leading-relaxed">
              {product.description || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="text-2xl font-bold text-gray-900">{formatRupiah(product.price)}</div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-gray-400" /> Harga</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(product.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400" /> Stok</span>
                  <span className={`font-semibold ${product.stock === 0 ? "text-red-500" : "text-green-600"}`}>
                    {product.stock === 0 ? "Habis" : product.stock}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-gray-400" /> Terjual</span>
                  <span className="font-semibold">{product.totalSold.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Garansi</span>
                  <span className="font-semibold">{product.warrantyDays} Hari</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={product.stock === 0}
                  onClick={() => setLocation(`/shop/checkout/${product.id}`)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.stock === 0 ? "Stok Habis" : "Beli Sekarang"}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
              <p className="font-semibold">ℹ️ Informasi Pembelian</p>
              <p>• Pembayaran via QRIS (scan QR)</p>
              <p>• Upload bukti transfer setelah bayar</p>
              <p>• Akun dikirim setelah pembayaran diverifikasi admin</p>
            </div>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
