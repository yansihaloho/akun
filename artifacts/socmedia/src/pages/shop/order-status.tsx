import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ShopLayout from "@/components/layout/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, CheckCircle2, Package, XCircle, Loader2 } from "lucide-react";

type Order = {
  id: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  buyerName: string;
  status: "pending" | "paid" | "delivered" | "cancelled";
  paymentProof: string | null;
  credentials: string | null;
  createdAt: string;
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const STATUS_CONFIG = {
  pending: { label: "Menunggu Pembayaran", color: "text-orange-600 bg-orange-50 border-orange-200", icon: Clock },
  paid: { label: "Menunggu Verifikasi", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Loader2 },
  delivered: { label: "Terkirim", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
};

export default function OrderStatus() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const defaultCode = params.get("code") ?? "";

  const [inputCode, setInputCode] = useState(defaultCode);
  const [searchCode, setSearchCode] = useState(defaultCode);

  useEffect(() => {
    if (defaultCode) setSearchCode(defaultCode);
  }, [defaultCode]);

  const { data: order, isLoading, isError, refetch } = useQuery<Order>({
    queryKey: ["order-status", searchCode],
    queryFn: () =>
      fetch(`/api/orders/${searchCode.toUpperCase()}`).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Pesanan tidak ditemukan");
        return json;
      }),
    enabled: !!searchCode,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCode(inputCode.trim().toUpperCase());
  };

  const statusCfg = order ? STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending : null;

  return (
    <ShopLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Cek Status Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">Masukkan kode pesanan Anda</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Contoh: AB12CD34"
            className="font-mono tracking-widest uppercase h-10"
            maxLength={8}
          />
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-10 px-5">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {isLoading && (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {isError && searchCode && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-600">
            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="font-medium">Pesanan tidak ditemukan</p>
            <p className="text-sm mt-1">Pastikan kode pesanan benar</p>
          </div>
        )}

        {order && statusCfg && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${statusCfg.color}`}>
              <div className="flex items-center gap-2">
                <statusCfg.icon className="w-5 h-5" />
                <span className="font-semibold">{statusCfg.label}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Kode Pesanan</span>
                <span className="font-mono font-bold text-gray-900">{order.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Produk</span>
                <span className="font-medium text-right max-w-[200px]">{order.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah</span>
                <span className="font-medium">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-indigo-600">{formatRupiah(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium">{order.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
              {order.paymentProof && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bukti Bayar</span>
                  <span className="text-green-600 font-medium">✓ Terupload</span>
                </div>
              )}
            </div>

            {order.status === "delivered" && order.credentials && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800">Akun Anda</span>
                </div>
                <pre className="text-xs text-green-900 whitespace-pre-wrap font-mono bg-white rounded-lg p-3 border border-green-200 break-all">
                  {order.credentials}
                </pre>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={() => refetch()}>
              Refresh Status
            </Button>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
