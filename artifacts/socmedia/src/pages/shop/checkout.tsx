import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import ShopLayout from "@/components/layout/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Upload, Copy, Check, Loader2 } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  warrantyDays: number;
  platform: string;
};

type Order = {
  id: number;
  orderCode: string;
  totalPrice: number;
  buyerName: string;
  status: string;
};

type QrisSettings = {
  image: string | null;
  accountName: string;
  accountNumber: string;
  whatsapp?: string;
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({ buyerName: "", buyerWhatsapp: "", quantity: 1 });
  const [order, setOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["shop-product", id],
    queryFn: () => fetch(`/api/products/${id}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

  const { data: qris } = useQuery<QrisSettings>({
    queryKey: ["qris-settings"],
    queryFn: () => fetch("/api/settings/qris").then((r) => r.json()),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: { productId: number; quantity: number; buyerName: string; buyerWhatsapp: string }) =>
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Gagal membuat pesanan");
        return json;
      }),
    onSuccess: (data) => {
      setOrder(data);
      setStep("payment");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!proofFile || !order) throw new Error("Bukti bayar diperlukan");
      const base64 = await toBase64(proofFile);
      const r = await fetch(`/api/orders/${order.orderCode}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof: base64 }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Gagal upload bukti");
      return json;
    },
    onSuccess: () => {
      setStep("done");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!form.buyerName.trim() || !form.buyerWhatsapp.trim()) {
      toast({ title: "Nama dan WhatsApp wajib diisi", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      productId: product.id,
      quantity: form.quantity,
      buyerName: form.buyerName,
      buyerWhatsapp: form.buyerWhatsapp,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const b64 = await toBase64(file);
    setProofPreview(b64);
  };

  const copyCode = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (productLoading) {
    return (
      <ShopLayout>
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-40 w-full" />
      </ShopLayout>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <div className="text-center py-20 text-gray-400">
          <p>Produk tidak ditemukan</p>
          <Button className="mt-4" onClick={() => setLocation("/shop")}>Kembali ke Toko</Button>
        </div>
      </ShopLayout>
    );
  }

  const totalPrice = product.price * form.quantity;

  return (
    <ShopLayout>
      {step === "form" && (
        <button
          onClick={() => setLocation(`/shop/produk/${product.id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Produk
        </button>
      )}

      <div className="max-w-lg mx-auto">
        {step === "form" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-1">Form Pembelian</h2>
            <p className="text-sm text-gray-500 mb-5">{product.name}</p>

            <div className="bg-gray-50 rounded-lg p-3 mb-5 flex justify-between items-center text-sm">
              <span className="text-gray-600">Harga satuan</span>
              <span className="font-semibold">{formatRupiah(product.price)}</span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <Label className="text-xs">Nama Lengkap *</Label>
                <Input
                  value={form.buyerName}
                  onChange={(e) => setForm((p) => ({ ...p, buyerName: e.target.value }))}
                  placeholder="Nama Anda"
                  className="mt-1 h-9 text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Nomor WhatsApp *</Label>
                <Input
                  value={form.buyerWhatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, buyerWhatsapp: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1 h-9 text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Jumlah</Label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                    className="w-8 h-8 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                  >−</button>
                  <span className="w-8 text-center font-semibold text-sm">{form.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, quantity: Math.min(product.stock, p.quantity + 1) }))}
                    className="w-8 h-8 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                  >+</button>
                  <span className="text-xs text-gray-400 ml-1">(max {product.stock})</span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold text-indigo-600">{formatRupiah(totalPrice)}</span>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
                ) : "Lanjut ke Pembayaran"}
              </Button>
            </form>
          </div>
        )}

        {step === "payment" && order && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-900 mb-1">Kode Pesanan Anda</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-indigo-700 tracking-widest">{order.orderCode}</span>
                <button onClick={copyCode} className="text-indigo-500 hover:text-indigo-700">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Simpan kode ini untuk cek status pesanan</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Scan QRIS untuk Pembayaran</h3>
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-900 mb-3">{formatRupiah(order.totalPrice)}</p>
                {qris?.image ? (
                  <img src={qris.image} alt="QRIS" className="w-56 h-56 object-contain mx-auto border border-gray-200 rounded-lg" />
                ) : (
                  <div className="w-56 h-56 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    QRIS belum diset admin
                  </div>
                )}
                {qris?.accountName && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">{qris.accountName}</p>
                )}
                {qris?.accountNumber && (
                  <p className="text-xs text-gray-400">{qris.accountNumber}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Upload Bukti Pembayaran</p>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {proofPreview ? (
                  <div className="space-y-2">
                    <img src={proofPreview} alt="Bukti bayar" className="w-full max-h-48 object-contain rounded-lg border border-green-200" />
                    <button
                      onClick={() => { setProofFile(null); setProofPreview(null); }}
                      className="text-xs text-gray-500 hover:text-red-500 underline"
                    >
                      Ganti bukti
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg p-4 text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Klik untuk upload screenshot bukti bayar</p>
                  </div>
                )}

                <Button
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  onClick={() => uploadProofMutation.mutate()}
                  disabled={!proofFile || uploadProofMutation.isPending}
                >
                  {uploadProofMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengupload...</>
                  ) : "Konfirmasi Pembayaran"}
                </Button>
              </div>
            </div>

            {qris?.whatsapp && (
              <a
                href={`https://wa.me/${qris.whatsapp.replace(/\D/g, "")}?text=Halo, saya sudah bayar pesanan ${order.orderCode}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Hubungi Admin via WhatsApp
              </a>
            )}
          </div>
        )}

        {step === "done" && order && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Diterima!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Bukti pembayaran Anda sudah kami terima. Admin akan memverifikasi dan mengirim akun segera.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm">
              <p className="text-gray-500 mb-1">Kode Pesanan</p>
              <p className="font-mono font-bold text-lg text-gray-900 tracking-widest">{order.orderCode}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/shop/cek-pesanan?code=${order.orderCode}`)}
              >
                Cek Status
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setLocation("/shop")}
              >
                Kembali ke Toko
              </Button>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
