import { useGetAccountStats, useListAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Facebook, Instagram, Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  CP: "#6366f1",
  ADS: "#3b82f6",
  BAN: "#ef4444",
  DISABLED: "#f97316",
  AKTIF: "#22c55e",
  SPAM: "#eab308",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAccountStats();
  const { data: accounts, isLoading: accountsLoading } = useListAccounts();

  const isLoading = statsLoading || accountsLoading;

  const platformData = stats
    ? [
        { name: "Facebook", value: stats.facebook, color: "#3b82f6" },
        { name: "Instagram", value: stats.instagram, color: "#e1306c" },
      ].filter((d) => d.value > 0)
    : [];

  const statusBarData = stats?.byStatus ?? [];

  const recentAccounts = accounts?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Ringkasan akun media sosial Anda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Akun"
          value={stats?.total}
          icon={<Users className="w-5 h-5" />}
          loading={isLoading}
          color="text-primary"
        />
        <StatCard
          title="Facebook"
          value={stats?.facebook}
          icon={<Facebook className="w-5 h-5" />}
          loading={isLoading}
          color="text-blue-500"
        />
        <StatCard
          title="Instagram"
          value={stats?.instagram}
          icon={<Instagram className="w-5 h-5" />}
          loading={isLoading}
          color="text-pink-500"
        />
        <StatCard
          title="Status Unik"
          value={stats?.byStatus.length}
          icon={<Activity className="w-5 h-5" />}
          loading={isLoading}
          color="text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : platformData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akun per Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : statusBarData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusBarData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Jumlah" radius={[4, 4, 0, 0]}>
                    {statusBarData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentAccounts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Belum ada akun</p>
          ) : (
            <div className="divide-y divide-border">
              {recentAccounts.map((acct) => (
                <div key={acct.id} className="flex items-center gap-3 py-2.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${acct.platform === "facebook" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                    {acct.platform === "facebook" ? "FB" : "IG"}
                  </span>
                  <span className="font-medium text-sm flex-1 truncate">{acct.nama}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">{acct.email}</span>
                  <StatusBadge status={acct.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
  color,
}: {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <span className={color}>{icon}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-bold">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
}
