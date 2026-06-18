import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Settings, Loader2, Store, Palette, X } from "lucide-react";

type QrisSettings = {
  image: string | null;
  accountName: string;
  accountNumber: string;
  whatsapp: string;
};

type StoreProfile = {
  storeName: string;
  tagline: string;
  logo: string | null;
  primaryColor: string;
  bannerText: string;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PRESET_COLORS = [
  { label: "Indigo", value: "#4f46e5" },
  { label: "Biru", value: "#2563eb" },
  { label: "Hijau", value: "#16a34a" },
  { label: "Merah", value: "#dc2626" },
  { label: "Ungu", value: "#9333ea" },
  { label: "Orange", value: "#ea580c" },
  { label: "Pink", value: "#db2777" },
  { label: "Teal", value: "#0d9488" },
];

export default function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();

  // ─── QRIS State ───────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [qrisInitialized, setQrisInitialized] = useState(false);

  const { data: qris, isLoading: qrisLoading } = useQuery<QrisSettings>({
    queryKey: ["admin-qris"],
    queryFn: () => fetch("/api/settings/qris", { credentials: "include" }).then((r) => r.json()),
  });

  useEffect(() => {
    if (qris && !qrisInitialized) {
      setAccountName(qris.accountName ?? "");
      setAccountNumber(qris.accountNumber ?? "");
      setWhatsapp(qris.whatsapp ?? "");
      if (qris.image) setPreviewSrc(qris.image);
      setQrisInitialized(true);
    }
  }, [qris, qrisInitialized]);

  const qrisMutation = useMutation({
    mutationFn: (data: { image: string; accountName: string; accountNumber: string; whatsapp: string }) =>
      fetch("/api/admin/settings/qris", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        return j;
      }),
    onSuccess: () => {
      toast({ title: "Pengaturan QRIS disimpan" });
      qc.invalidateQueries({ queryKey: ["admin-qris"] });
      qc.invalidateQueries({ queryKey: ["qris-settings"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const handleQrisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setPreviewSrc(base64);
    e.target.value = "";
  };

  const handleSaveQris = () => {
    const img = previewSrc ?? qris?.image ?? "";
    if (!img) {
      toast({ title: "Upload gambar QRIS terlebih dahulu", variant: "destructive" });
      return;
    }
    qrisMutation.mutate({ image: img, accountName, accountNumber, whatsapp });
  };

  // ─── Store Profile State ──────────────────────────────────────────────────
  const logoRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState("SocMedia Shop");
  const [tagline, setTagline] = useState("");
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [bannerText, setBannerText] = useState("");
  const [profileInitialized, setProfileInitialized] = useState(false);

  const { data: storeProfile, isLoading: profileLoading } = useQuery<StoreProfile>({
    queryKey: ["admin-store-profile"],
    queryFn: () => fetch("/api/settings/store-profile", { credentials: "include" }).then((r) => r.json()),
  });

  useEffect(() => {
    if (storeProfile && !profileInitialized) {
      setStoreName(storeProfile.storeName ?? "SocMedia Shop");
      setTagline(storeProfile.tagline ?? "");
      setLogoSrc(storeProfile.logo ?? null);
      setPrimaryColor(storeProfile.primaryColor ?? "#4f46e5");
      setBannerText(storeProfile.bannerText ?? "");
      setProfileInitialized(true);
    }
  }, [storeProfile, profileInitialized]);

  const profileMutation = useMutation({
    mutationFn: (data: StoreProfile) =>
      fetch("/api/admin/settings/store-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        return j;
      }),
    onSuccess: () => {
      toast({ title: "Profil toko disimpan" });
      qc.invalidateQueries({ queryKey: ["admin-store-profile"] });
      qc.invalidateQueries({ queryKey: ["store-profile"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setLogoSrc(base64);
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    if (!storeName.trim()) {
      toast({ title: "Nama toko tidak boleh kosong", variant: "destructive" });
      return;
    }
    profileMutation.mutate({ storeName, tagline, logo: logoSrc, primaryColor, bannerText });
  };

  const displayQrisImage = previewSrc ?? qris?.image ?? null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Konfigurasi toko & pembayaran</p>
      </div>

      {/* ── Store Profile ─────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-5">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Profil Toko
        </h2>

        {/* Live preview */}
        <div
          className="rounded-xl overflow-hidden shadow-sm border border-border"
          style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}bb)` }}
        >
          <div className="px-5 py-4 flex items-center gap-4">
            {logoSrc ? (
              <img src={logoSrc} alt="logo" className="w-12 h-12 rounded-xl object-contain bg-white/20 p-1 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-white text-base leading-tight truncate">
                {storeName || "Nama Toko"}
              </p>
              {tagline && (
                <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{tagline}</p>
              )}
            </div>
          </div>
          {bannerText && (
            <div className="bg-black/20 px-5 py-2">
              <p className="text-white/90 text-xs">{bannerText}</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground -mt-2 text-center">↑ Preview tampilan banner di toko</p>

        {/* Logo upload */}
        <div>
          <Label className="text-xs mb-2 block">Logo Toko (opsional)</Label>
          <input type="file" accept="image/*" ref={logoRef} onChange={handleLogoChange} className="hidden" />
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <>
                <img src={logoSrc} alt="logo" className="w-14 h-14 rounded-xl object-contain border border-border bg-muted" />
                <div className="space-y-1">
                  <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="text-xs h-7 block">
                    <Upload className="w-3 h-3 mr-1" />
                    Ganti Logo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLogoSrc(null)} className="text-xs h-7 text-destructive hover:text-destructive block">
                    <X className="w-3 h-3 mr-1" />
                    Hapus Logo
                  </Button>
                </div>
              </>
            ) : (
              <button
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload logo (PNG/JPG)
              </button>
            )}
          </div>
        </div>

        {/* Store name */}
        <div>
          <Label className="text-xs mb-1 block">Nama Toko *</Label>
          <Input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: SocMedia Shop"
            maxLength={100}
          />
        </div>

        {/* Tagline */}
        <div>
          <Label className="text-xs mb-1 block">Tagline / Deskripsi Singkat</Label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: Akun FB & IG berkualitas terpercaya"
            maxLength={200}
          />
        </div>

        {/* Primary color */}
        <div>
          <Label className="text-xs mb-2 block flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Warna Tema
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                title={c.label}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${primaryColor === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 text-sm w-32 font-mono"
              placeholder="#4f46e5"
              maxLength={7}
            />
            <span className="text-xs text-muted-foreground">Warna kustom</span>
          </div>
        </div>

        {/* Banner text */}
        <div>
          <Label className="text-xs mb-1 block">Teks Banner / Pengumuman (opsional)</Label>
          <Input
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: 🎉 Promo spesial! Garansi 30 hari untuk semua akun"
            maxLength={300}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Tampil sebagai strip pengumuman di bawah banner toko</p>
        </div>

        <Button onClick={handleSaveProfile} disabled={profileMutation.isPending || !storeName.trim()} className="w-full">
          {profileMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
          ) : "Simpan Profil Toko"}
        </Button>
      </div>

      {/* ── QRIS ──────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-5">
        <h2 className="font-semibold text-sm">Konfigurasi QRIS</h2>

        <div>
          <Label className="text-xs mb-2 block">Gambar QRIS</Label>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleQrisFileChange} className="hidden" />

          {displayQrisImage ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={displayQrisImage}
                  alt="QRIS"
                  className="w-48 h-48 object-contain border border-border rounded-xl"
                />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="text-xs h-8">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Ganti Gambar
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              {qrisLoading ? (
                <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Klik untuk upload gambar QRIS</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG hingga 2MB</p>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs mb-1 block">Nama Penerima</Label>
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: Toko SocMedia"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Nomor Rekening / HP QRIS (opsional)</Label>
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: 0812-xxxx-xxxx"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">WhatsApp Admin (untuk tombol hubungi di toko)</Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="h-8 text-sm"
            placeholder="Contoh: 628123456789 (format internasional)"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Gunakan format: 628xxxxxxxxx (tanpa + dan tanpa spasi)</p>
        </div>

        <Button onClick={handleSaveQris} disabled={qrisMutation.isPending} className="w-full">
          {qrisMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
          ) : "Simpan Pengaturan QRIS"}
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
        <p className="font-semibold">Tips penggunaan QRIS:</p>
        <p>• Upload gambar QRIS statis dari aplikasi bank/dompet digital Anda</p>
        <p>• Pembeli akan scan QR ini dan transfer sesuai nominal pesanan</p>
        <p>• Setelah pembeli upload bukti bayar, status otomatis berubah ke "Bukti Dikirim"</p>
        <p>• Verifikasi manual di menu Pesanan, lalu ubah status ke "Terkirim" + isi kredensial akun</p>
        <p>• Nomor WhatsApp akan tampil sebagai tombol di halaman toko &amp; cek pesanan</p>
      </div>
    </div>
  );
}
