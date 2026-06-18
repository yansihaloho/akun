import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Settings, Loader2 } from "lucide-react";

type QrisSettings = {
  image: string | null;
  accountName: string;
  accountNumber: string;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: qris, isLoading } = useQuery<QrisSettings>({
    queryKey: ["admin-qris"],
    queryFn: () => fetch("/api/settings/qris", { credentials: "include" }).then((r) => r.json()),
  });

  useEffect(() => {
    if (qris && !initialized) {
      setAccountName(qris.accountName ?? "");
      setAccountNumber(qris.accountNumber ?? "");
      if (qris.image) setPreviewSrc(qris.image);
      setInitialized(true);
    }
  }, [qris, initialized]);

  const saveMutation = useMutation({
    mutationFn: (data: { image: string; accountName: string; accountNumber: string }) =>
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setPreviewSrc(base64);
    e.target.value = "";
  };

  const handleSave = () => {
    const img = previewSrc ?? qris?.image ?? "";
    if (!img) {
      toast({ title: "Upload gambar QRIS terlebih dahulu", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ image: img, accountName, accountNumber });
  };

  const displayImage = previewSrc ?? qris?.image ?? null;

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Konfigurasi pembayaran QRIS toko</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-5">
        <h2 className="font-semibold text-sm">Konfigurasi QRIS</h2>

        <div>
          <Label className="text-xs mb-2 block">Gambar QRIS</Label>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

          {displayImage ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={displayImage}
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
              {isLoading ? (
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

        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
          {saveMutation.isPending ? (
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
      </div>
    </div>
  );
}
