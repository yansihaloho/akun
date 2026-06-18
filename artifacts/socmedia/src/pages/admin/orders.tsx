import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, CheckCircle2, Package, XCircle, Loader2, Eye, ExternalLink,
  ShoppingBag, ChevronDown, Search, Send,
} from "lucide-react";

type Order = {
  id: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  buyerName: string;
  buyerWhatsapp: string;
  status: "pending" | "paid" | "delivered" | "cancelled";
  paymentProof: string | null;
  credentials: string | null;
  notes: string | null;
  createdAt: string;
};


const STATUS_CONFIG = {
  pending: { label: "Menunggu Bayar", color: "bg-orange-100 text-orange-700", icon: Clock },
  paid: { label: "Bukti Dikirim", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  delivered: { label: "Terkirim", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700", icon: XCircle },
};

const STATUS_OPTIONS = ["pending", "paid", "delivered", "cancelled"] as const;

export default function AdminOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [credentials, setCredentials] = useState("");
  const [notes, setNotes] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders", { credentials: "include" }).then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      fetch(`/api/admin/orders/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }),
    onSuccess: (updated) => {
      toast({ title: "Pesanan diperbarui" });
      if (selectedOrder) setSelectedOrder(updated);
      setCredentials(updated.credentials ?? "");
      invalidate();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/orders/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }),
    onSuccess: (updated) => {
      toast({ title: "✅ Akun berhasil dikirim ke pembeli!", description: `Pesanan ${updated.orderCode} → Terkirim` });
      invalidate();
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
        setNewStatus(updated.status);
        setCredentials(updated.credentials ?? "");
      }
    },
    onError: (e: Error) => toast({ title: "Gagal konfirmasi", description: e.message, variant: "destructive" }),
  });

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCredentials(order.credentials ?? "");
    setNotes(order.notes ?? "");
    setProofOpen(false);
  };

  const handleSave = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      id: selectedOrder.id,
      data: {
        status: newStatus,
        credentials: credentials || null,
        notes: notes || null,
      },
    });
  };

  const filtered = orders
    .filter((o) => filterStatus === "all" || o.status === filterStatus)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.buyerWhatsapp.includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    });

  const pendingCount = orders.filter((o) => o.status === "paid").length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            Pesanan
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola semua pesanan dari pembeli</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, produk..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{search || filterStatus !== "all" ? "Tidak ada pesanan yang cocok" : "Tidak ada pesanan"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const Icon = cfg.icon;
            const isConfirming = confirmMutation.isPending && confirmMutation.variables === order.id;
            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => openOrder(order)}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-sm text-foreground">{order.orderCode}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
                        <Icon className={`w-3 h-3 ${order.status === "paid" ? "animate-spin" : ""}`} />
                        {cfg.label}
                      </span>
                      {order.paymentProof && order.status === "paid" && (
                        <span className="text-xs text-blue-600 font-medium">• Ada bukti bayar</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{order.productName} × {order.quantity}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.buyerName} · {order.buyerWhatsapp}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="font-semibold text-sm">{formatRupiah(order.totalPrice)}</p>
                    {order.status === "paid" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-3 gap-1.5"
                        disabled={isConfirming}
                        onClick={(e) => { e.stopPropagation(); confirmMutation.mutate(order.id); }}
                      >
                        {isConfirming
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Memproses...</>
                          : <><Send className="w-3 h-3" /> Konfirmasi & Kirim</>
                        }
                      </Button>
                    )}
                    {order.status !== "paid" && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono">{selectedOrder.orderCode}</DialogTitle>
              <DialogDescription>
                Detail dan kelola status pesanan dari {selectedOrder.buyerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="font-medium text-right max-w-[200px]">{selectedOrder.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium">{selectedOrder.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatRupiah(selectedOrder.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pembeli</span>
                  <span className="font-medium">{selectedOrder.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <a
                    href={`https://wa.me/${selectedOrder.buyerWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-green-600 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedOrder.buyerWhatsapp}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {selectedOrder.paymentProof && (
                <div>
                  <button
                    onClick={() => setProofOpen(!proofOpen)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Bukti Bayar
                    <ChevronDown className={`w-3 h-3 transition-transform ${proofOpen ? "rotate-180" : ""}`} />
                  </button>
                  {proofOpen && (
                    <img
                      src={selectedOrder.paymentProof}
                      alt="Bukti pembayaran"
                      className="mt-2 w-full rounded-lg border border-border max-h-64 object-contain"
                    />
                  )}
                </div>
              )}

              {selectedOrder.status === "paid" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">🚀 Konfirmasi Otomatis</p>
                  <p className="text-xs text-blue-700 mb-3">
                    Klik tombol di bawah untuk otomatis mengambil {selectedOrder.quantity} akun dari pool, mengirimkannya ke pembeli, dan menandai akun tersebut sebagai terjual.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    disabled={confirmMutation.isPending}
                    onClick={() => { confirmMutation.mutate(selectedOrder.id); }}
                  >
                    {confirmMutation.isPending
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...</>
                      : <><Send className="w-3.5 h-3.5" /> Konfirmasi & Kirim Akun Otomatis</>
                    }
                  </Button>
                </div>
              )}

              <div>
                <Label className="text-xs">Status Pesanan</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Kredensial Akun (tampil ke pembeli saat status "Terkirim")</Label>
                <textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  rows={5}
                  className="w-full mt-1 px-3 py-2 text-xs font-mono border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={"Terisi otomatis saat Konfirmasi, atau isi manual di sini"}
                />
              </div>

              <div>
                <Label className="text-xs">Catatan Admin (tidak tampil ke pembeli)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Catatan internal..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>Tutup</Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</> : "Simpan Manual"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
