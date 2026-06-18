import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useListAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useImportAccounts,
  getListAccountsQueryKey,
  getGetAccountStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Pencil, Trash2, Search, Filter, Eye, EyeOff } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import Papa from "papaparse";

const STATUS_OPTIONS = ["CP", "ADS", "BAN", "DISABLED", "AKTIF", "SPAM"];
const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
];

type AccountForm = {
  platform: "facebook" | "instagram";
  nama: string;
  email: string;
  sandi: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  sandi_fb: string;
  kode_2fa: string;
  uid: string;
  sandi_email: string;
  email_pemulihan: string;
  status: string;
  catatan: string;
};

const defaultForm: AccountForm = {
  platform: "facebook",
  nama: "",
  email: "",
  sandi: "",
  tgl_lahir: "",
  jenis_kelamin: "",
  sandi_fb: "",
  kode_2fa: "",
  uid: "",
  sandi_email: "",
  email_pemulihan: "",
  status: "CP",
  catatan: "",
};

const STATUS_COLORS: Record<string, string> = {
  CP: "bg-indigo-100 text-indigo-700",
  ADS: "bg-blue-100 text-blue-700",
  BAN: "bg-red-100 text-red-700",
  DISABLED: "bg-orange-100 text-orange-700",
  AKTIF: "bg-green-100 text-green-700",
  SPAM: "bg-yellow-100 text-yellow-700",
};

function MaskedCell({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-0.5">
      <span className={`text-xs font-mono ${show ? "break-all" : "tracking-widest"}`}>
        {show ? value : "••••••"}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setShow((v) => !v); }}
        className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
        title={show ? "Sembunyikan" : "Tampilkan"}
      >
        {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
      <CopyButton value={value} size="xs" />
    </div>
  );
}

export default function Accounts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AccountForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("CP");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const params = {
    ...(platformFilter !== "all" ? { platform: platformFilter as "facebook" | "instagram" } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data: accounts, isLoading } = useListAccounts(Object.keys(params).length ? params : undefined);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const importMutation = useImportAccounts();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAccountsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAccountStatsQueryKey() });
  };

  const filtered = (accounts ?? []).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.uid ?? "").toLowerCase().includes(q)
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (acct: (typeof filtered)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(acct.id);
    setForm({
      platform: acct.platform as "facebook" | "instagram",
      nama: acct.nama,
      email: acct.email,
      sandi: acct.sandi,
      tgl_lahir: acct.tgl_lahir ?? "",
      jenis_kelamin: acct.jenis_kelamin ?? "",
      sandi_fb: acct.sandi_fb ?? "",
      kode_2fa: acct.kode_2fa ?? "",
      uid: acct.uid ?? "",
      sandi_email: acct.sandi_email ?? "",
      email_pemulihan: acct.email_pemulihan ?? "",
      status: acct.status,
      catatan: acct.catatan ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      tgl_lahir: form.tgl_lahir || undefined,
      jenis_kelamin: form.jenis_kelamin || undefined,
      sandi_fb: form.sandi_fb || undefined,
      kode_2fa: form.kode_2fa || undefined,
      uid: form.uid || undefined,
      sandi_email: form.sandi_email || undefined,
      email_pemulihan: form.email_pemulihan || undefined,
      catatan: form.catatan || undefined,
    };

    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Akun diperbarui" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Akun dibuat" });
      }
      setDialogOpen(false);
      invalidate();
    } catch {
      toast({ title: "Gagal menyimpan akun", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Akun dihapus" });
      invalidate();
    } catch {
      toast({ title: "Gagal menghapus akun", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkStatusUpdate = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => updateMutation.mutateAsync({ id, data: { status: bulkStatus } })));
      toast({ title: `${ids.length} akun diperbarui ke status ${bulkStatus}` });
      setSelectedIds(new Set());
      setBulkStatusOpen(false);
      invalidate();
    } catch {
      toast({ title: "Gagal update status massal", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const csv = Papa.unparse(
      filtered.map((a) => ({
        platform: a.platform,
        nama: a.nama,
        tgl_lahir: a.tgl_lahir ?? "",
        jenis_kelamin: a.jenis_kelamin ?? "",
        email: a.email,
        sandi: a.sandi,
        sandi_fb: a.sandi_fb ?? "",
        kode_2fa: a.kode_2fa ?? "",
        uid: a.uid ?? "",
        sandi_email: a.sandi_email ?? "",
        email_pemulihan: a.email_pemulihan ?? "",
        status: a.status,
        catatan: a.catatan ?? "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as Record<string, string>[];
        const accts = rows.map((r) => ({
          platform: (r["platform"] || "facebook") as "facebook" | "instagram",
          nama: r["nama"] || "",
          email: r["email"] || "",
          sandi: r["sandi"] || "",
          tgl_lahir: r["tgl_lahir"] || undefined,
          jenis_kelamin: r["jenis_kelamin"] || undefined,
          sandi_fb: r["sandi_fb"] || undefined,
          kode_2fa: r["kode_2fa"] || undefined,
          uid: r["uid"] || undefined,
          sandi_email: r["sandi_email"] || undefined,
          email_pemulihan: r["email_pemulihan"] || undefined,
          status: r["status"] || "CP",
          catatan: r["catatan"] || undefined,
        }));

        try {
          const res = await importMutation.mutateAsync({ data: { accounts: accts } });
          toast({ title: `Import selesai: ${res.imported} berhasil, ${res.failed} gagal` });
          invalidate();
        } catch {
          toast({ title: "Import gagal", variant: "destructive" });
        }
      },
    });
    e.target.value = "";
  };

  const f = (key: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const isPending = createMutation.isPending || updateMutation.isPending || importMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Akun</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola akun Facebook &amp; Instagram</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} className="h-8 px-2 text-xs">
            <Upload className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 px-2 text-xs">
            <Download className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={openCreate} className="h-8 px-2 text-xs">
            <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <Filter className="w-3 h-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {someSelected && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-primary">{selectedIds.size} dipilih</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
              Batal
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => setBulkStatusOpen(true)}>
              Ubah Status
            </Button>
          </div>
        </div>
      )}

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Tidak ada akun ditemukan</div>
        ) : (
          filtered.map((acct) => (
            <div
              key={acct.id}
              className="rounded-lg border border-border bg-card p-3 cursor-pointer active:bg-muted/30"
              onClick={() => setLocation(`/accounts/${acct.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={selectedIds.has(acct.id)}
                    onCheckedChange={() => toggleOne(acct.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Pilih ${acct.nama}`}
                  />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${acct.platform === "facebook" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                    {acct.platform === "facebook" ? "FB" : "IG"}
                  </span>
                  <span className="font-medium text-sm truncate">{acct.nama}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[acct.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {acct.status}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-muted-foreground truncate">{acct.email}</span>
                <CopyButton value={acct.email} size="xs" />
              </div>
              {acct.uid && (
                <div className="text-xs text-muted-foreground font-mono truncate">UID: {acct.uid}</div>
              )}
              <div className="flex justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(acct, e)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(acct.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-xs">Platform</TableHead>
                <TableHead className="text-xs">Nama</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Sandi</TableHead>
                <TableHead className="text-xs">UID</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Catatan</TableHead>
                <TableHead className="w-20 text-xs text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                    Tidak ada akun ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((acct) => (
                  <TableRow
                    key={acct.id}
                    className="text-sm cursor-pointer hover:bg-muted/30"
                    onClick={() => setLocation(`/accounts/${acct.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(acct.id)}
                        onCheckedChange={() => toggleOne(acct.id)}
                        aria-label={`Pilih ${acct.nama}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${acct.platform === "facebook" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                        {acct.platform === "facebook" ? "FB" : "IG"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[120px] truncate">{acct.nama}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5 max-w-[160px]">
                        <span className="text-muted-foreground text-xs truncate">{acct.email}</span>
                        <CopyButton value={acct.email} size="xs" />
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MaskedCell value={acct.sandi} />
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs max-w-[100px] truncate">
                      {acct.uid ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[acct.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {acct.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[120px] truncate">
                      {acct.catatan ?? "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(acct, e)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(acct.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform *</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v as "facebook" | "instagram" }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Nama *" value={form.nama} onChange={f("nama")} />
            <Field label="Email *" value={form.email} onChange={f("email")} type="email" />
            <Field label="Sandi *" value={form.sandi} onChange={f("sandi")} type="password" />
            <Field label="Sandi FB" value={form.sandi_fb} onChange={f("sandi_fb")} type="password" />
            <Field label="Tgl Lahir" value={form.tgl_lahir} onChange={f("tgl_lahir")} placeholder="YYYY-MM-DD" />
            <Field label="Jenis Kelamin" value={form.jenis_kelamin} onChange={f("jenis_kelamin")} placeholder="L / P" />
            <Field label="Kode 2FA" value={form.kode_2fa} onChange={f("kode_2fa")} />
            <Field label="UID" value={form.uid} onChange={f("uid")} />
            <Field label="Sandi Email" value={form.sandi_email} onChange={f("sandi_email")} type="password" />
            <Field label="Email Pemulihan" value={form.email_pemulihan} onChange={f("email_pemulihan")} type="email" />
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Catatan</Label>
              <Input value={form.catatan} onChange={f("catatan")} className="h-8 text-sm" placeholder="Catatan opsional..." />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} size="sm" className="w-full sm:w-auto">Batal</Button>
            <Button onClick={handleSubmit} size="sm" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah Status — {selectedIds.size} akun</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1.5 block">Status baru</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkStatusOpen(false)} className="w-full sm:w-auto">Batal</Button>
            <Button size="sm" onClick={handleBulkStatusUpdate} disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending ? "Memperbarui..." : "Terapkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={onChange} type={type} placeholder={placeholder} className="h-8 text-sm" />
    </div>
  );
}
