import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Tag, Package, TrendingUp } from "lucide-react";

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

type ProductForm = {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  stock: string;
  warrantyDays: string;
  platform: string;
  category: string;
  isActive: boolean;
};

const defaultForm: ProductForm = {
  name: "", description: "", imageUrl: "", price: "", stock: "0",
  warrantyDays: "1", platform: "facebook", category: "", isActive: true,
};


export default function AdminProducts() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => fetch("/api/admin/products", { credentials: "include" }).then((r) => r.json()),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  const createMutation = useMutation({
    mutationFn: (data: object) =>
      fetch("/api/admin/products", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }),
    onSuccess: () => { toast({ title: "Produk dibuat" }); setDialogOpen(false); invalidate(); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      fetch(`/api/admin/products/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }),
    onSuccess: () => { toast({ title: "Produk diperbarui" }); setDialogOpen(false); invalidate(); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" }).then(async (r) => {
        if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      }),
    onSuccess: () => { toast({ title: "Produk dihapus" }); setDeleteId(null); invalidate(); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description, imageUrl: p.imageUrl ?? "",
      price: String(p.price), stock: String(p.stock), warrantyDays: String(p.warrantyDays),
      platform: p.platform, category: p.category ?? "", isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: form.name, description: form.description,
      imageUrl: form.imageUrl || null, price: parseInt(form.price),
      stock: parseInt(form.stock), warrantyDays: parseInt(form.warrantyDays),
      platform: form.platform, category: form.category || null, isActive: form.isActive,
    };
    if (editingId !== null) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const f = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Produk</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola produk yang dijual di toko</p>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 px-3 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Tambah Produk
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada produk. Klik tombol "Tambah Produk".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`rounded-xl border bg-card p-4 space-y-3 ${!p.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{p.name}</p>
                  {p.category && <p className="text-xs text-orange-500 font-medium mt-0.5">{p.category}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Harga</span>
                  <span className="font-semibold text-foreground">{formatRupiah(p.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Stok</span>
                  <span className={`font-medium ${p.stock === 0 ? "text-red-500" : "text-green-600"}`}>{p.stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Terjual</span>
                  <span className="font-medium text-foreground">{p.totalSold}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.platform === "facebook" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                  {p.platform === "facebook" ? "FB" : "IG"}
                </span>
                <span className={`text-xs flex items-center gap-1 ${p.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                  {p.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {p.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            <DialogDescription>
              {editingId !== null ? "Ubah informasi produk yang ada di toko." : "Isi detail produk baru untuk ditampilkan di toko."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nama Produk *</Label>
              <Input value={form.name} onChange={f("name")} className="mt-1 h-8 text-sm" placeholder="Nama produk..." />
            </div>
            <div>
              <Label className="text-xs">Deskripsi / Aturan Garansi</Label>
              <textarea
                value={form.description}
                onChange={f("description")}
                rows={4}
                className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Aturan Garansi: ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Harga (Rp) *</Label>
                <Input value={form.price} onChange={f("price")} type="number" min="0" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Stok</Label>
                <Input value={form.stock} onChange={f("stock")} type="number" min="0" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Garansi (hari)</Label>
                <Input value={form.warrantyDays} onChange={f("warrantyDays")} type="number" min="0" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Kategori (opsional)</Label>
              <Input value={form.category} onChange={f("category")} className="mt-1 h-8 text-sm" placeholder="Contoh: Akun FB, FB Spam" />
            </div>
            <div>
              <Label className="text-xs">URL Gambar (opsional)</Label>
              <Input value={form.imageUrl} onChange={f("imageUrl")} className="mt-1 h-8 text-sm" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="text-xs cursor-pointer">Aktif (tampil di toko)</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending || !form.name || !form.price}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>Produk akan dihapus permanen dari toko.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
