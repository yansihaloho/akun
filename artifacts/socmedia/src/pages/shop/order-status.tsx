import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ShopLayout from "@/components/layout/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, CheckCircle2, Package, XCircle, Loader2, Copy, Check } from "lucide-react";

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

type QrisSettings = {
  image: string | null;
  accountName: string;
  whatsapp?: string;
};


const STATUS_CONFIG = {
  pending: {
    label: "Menunggu Pembayaran",
    desc: "Silakan lakukan pembayaran via QRIS dan upload bukti transfer.",
    color: "text-orange-600 bg-orange-50 border-orange-200",
    icon: Clock,
    spin: false,
  },
  paid: {
    label: "Bukti Dikirim — Menunggu Verifikasi Admin",
    desc: "Admin sedang memverifikasi pembayaran Anda. Harap tunggu.",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: Loader2,
    spin: true,
  },
  delivered: {
    label: "Pesanan Terkirim",
    desc: "Pembayaran terverifikasi. Akun Anda tersedia di bawah.",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: CheckCircle2,
    spin: false,
  },
  cancelled: {
    label: "Pesanan Dibatalkan",
    desc: "Pesanan ini telah dibatalkan. Hubungi admin jika ada pertanyaan.",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: XCircle,
    spin: false,
  },
};

export default function OrderStatus() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const defaultCode = params.get("code") ?? "";

  const [inputCode, setInputCode] = useState(defaultCode);
  const [searchCode, setSearchCode] = useState(defaultCode);
  const [copiedCred, setCopiedCred] = useState(false);

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
    refetchInterval: (query) => {
      const data = query.state.data as Order | undefined;
      return data?.status === "paid" ? 15_000 : false;
    },
  });

  const { data: qris } = useQuery<QrisSettings>({
    queryKey: ["qris-settings"],
    queryFn: () => fetch("/api/settings/qris").then((r) => r.json()),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCode(inputCode.trim().toUpperCase());
  };

  const copyCreds = () => {
    if (order?.credentials) {
      navigator.clipboard.writeText(order.credentials);
      setCopiedCred(true);
      setTimeout(() => setCopiedCred(false), 2000);
    }
  };

  const statusCfg = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending) : null;

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
            <p className="text-sm mt-1">Pastikan kode pesanan benar (8 karakter)</p>
          </div>
        )}

        {order && statusCfg && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${statusCfg.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <statusCfg.icon className={`w-5 h-5 ${statusCfg.spin ? "animate-spin" : ""}`} />
                <span className="font-semibold">{statusCfg.label}</span>
              </div>
              <p className="text-xs opacity-80">{statusCfg.desc}</p>
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
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              {order.paymentProof && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bukti Bayar</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terupload
                  </span>
                </div>
              )}
            </div>

            {order.status === "delivered" && order.credentials && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Akun Anda</span>
                  </div>
                  <button
                    onClick={copyCreds}
                    className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs font-medium"
                  >
                    {copiedCred ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCred ? "Tersalin!" : "Salin"}
                  </button>
                </div>
                <pre className="text-xs text-green-900 whitespace-pre-wrap font-mono bg-white rounded-lg p-3 border border-green-200 break-all">
                  {order.credentials}
                </pre>
              </div>
            )}

            {order.status === "pending" && !order.paymentProof && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                <p className="font-semibold mb-1">Belum upload bukti?</p>
                <p className="text-xs">Kembali ke halaman checkout untuk upload bukti pembayaran Anda.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => refetch()}>
                <Loader2 className="w-3.5 h-3.5 mr-1.5" />
                Refresh Status
              </Button>
              {qris?.whatsapp && (
                <a
                  href={`https://wa.me/${qris.whatsapp.replace(/\D/g, "")}?text=Halo admin, cek pesanan saya: ${order.orderCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border border-green-300 text-green-700 text-xs font-medium hover:bg-green-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi Admin
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
