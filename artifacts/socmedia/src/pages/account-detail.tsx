import { useParams, useLocation } from "wouter";
import { useGetAccount } from "@workspace/api-client-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  CP: "bg-amber-100 text-amber-700",
  ADS: "bg-blue-100 text-blue-700",
  BAN: "bg-red-100 text-red-700",
  DISABLED: "bg-orange-100 text-orange-700",
  AKTIF: "bg-emerald-100 text-emerald-700",
  SPAM: "bg-yellow-100 text-yellow-700",
};

function FieldRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  copyable?: boolean;
}) {
  if (!value)
    return (
      <div className="flex justify-between py-2.5 border-b border-border last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground/40">—</span>
      </div>
    );
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className={`text-sm text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </span>
        {copyable && <CopyButton value={value} size="sm" />}
      </div>
    </div>
  );
}

function PasswordRow({ label, value }: { label: string; value?: string | null }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-mono ${show ? "break-all" : "tracking-widest"}`}>
          {show ? value : "••••••••"}
        </span>
        <button
          onClick={() => setShow((v) => !v)}
          className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={show ? "Sembunyikan" : "Tampilkan"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <CopyButton value={value} size="sm" />
      </div>
    </div>
  );
}

export default function AccountDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const accountId = parseInt(params.id ?? "0");

  const { data: account, isLoading } = useGetAccount(accountId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Akun tidak ditemukan.</p>
        <Button variant="link" onClick={() => setLocation("/accounts")}>
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/accounts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{account.nama}</h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[account.status] ?? "bg-slate-100 text-slate-700"}`}
              >
                {account.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              {account.platform === "facebook" ? (
                <>
                  <Facebook className="h-3.5 w-3.5 text-blue-600" />
                  <span>Facebook</span>
                </>
              ) : (
                <>
                  <Instagram className="h-3.5 w-3.5 text-pink-600" />
                  <span>Instagram</span>
                </>
              )}
              <span>•</span>
              <span>Dibuat {new Date(account.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation(`/accounts`)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Info Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldRow label="Nama" value={account.nama} copyable />
            <FieldRow label="Email" value={account.email} copyable />
            <PasswordRow label="Sandi" value={account.sandi} />
            {account.sandi_fb && <PasswordRow label="Sandi FB" value={account.sandi_fb} />}
            <FieldRow label="Status" value={account.status} />
            <FieldRow label="Platform" value={account.platform === "facebook" ? "Facebook" : "Instagram"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Data Keamanan</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldRow label="Kode 2FA" value={account.kode_2fa} mono copyable />
            <FieldRow label="UID" value={account.uid} mono copyable />
            <PasswordRow label="Sandi Email" value={account.sandi_email} />
            <FieldRow label="Email Pemulihan" value={account.email_pemulihan} copyable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Info Pribadi</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldRow label="Tgl Lahir" value={account.tgl_lahir} />
            <FieldRow label="Jenis Kelamin" value={account.jenis_kelamin} />
            <FieldRow label="Catatan" value={account.catatan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
