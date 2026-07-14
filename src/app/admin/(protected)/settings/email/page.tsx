import { sendTestEmail } from "@/app/admin/notification-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import { getTransactionalEmailProvider } from "@/lib/notifications/email-provider";
import { getMailConfig } from "@/lib/notifications/mail-config";

export const dynamic = "force-dynamic";

export default async function AdminEmailSettingsPage() {
  await requirePermission("notifications.settings.view");
  const config = getMailConfig();
  const provider = getTransactionalEmailProvider(config);
  const health = provider.verifyConnection
    ? await provider.verifyConnection()
    : { ok: false, provider: config.provider, errorCode: "VERIFY_UNSUPPORTED" };
  const queueHealth = await new PrismaNotificationRepository(prisma).getQueueHealth();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="E-posta Ayarları"
        description="SMTP/provider durumu, development capture modu, test e-postası ve queue sağlığını izleyin."
        eyebrow="Bildirimler"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Provider" value={config.provider} />
        <Metric label="Durum" value={health.ok ? "Hazır" : "Uyarı"} tone={health.ok ? "default" : "warning"} />
        <Metric label="Delivery disabled" value={config.disableDelivery ? "Evet" : "Hayır"} />
        <Metric label="From" value={config.fromAddress ? "Tanımlı" : "Eksik"} tone={config.fromAddress ? "default" : "warning"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Provider Durumu</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="SMTP host" value={config.smtp.host ? "Tanımlı" : "Eksik"} />
            <Row label="SMTP port" value={config.smtp.port ? String(config.smtp.port) : "Eksik"} />
            <Row label="SMTP secure" value={config.smtp.secure ? "true" : "false"} />
            <Row label="Pool" value={config.smtp.pool ? "Aktif" : "Kapalı"} />
            <Row label="Health error" value={health.errorCode ?? "-"} />
          </dl>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            SMTP parolası ve provider secretları burada gösterilmez. Production sır değerleri deployment secret manager tarafında tutulmalıdır.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Test E-postasi</h2>
          <form action={sendTestEmail} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              name="recipient"
              type="email"
              placeholder="admin@example.com"
              className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              required
            />
            <button className="min-h-11 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600">
              Test Gonder
            </button>
          </form>
          <p className="mt-3 text-sm text-slate-600">
            Development modunda e-posta `storage/private/mail-capture/` altina yakalanir; production&apos;da capture modu yasaktir.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Queue Sagligi</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {queueHealth.length ? (
            queueHealth.map((item) => (
              <Metric key={item.status} label={item.status} value={String(item.count)} />
            ))
          ) : (
            <p className="text-sm text-slate-600">Email delivery kaydi yok.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
      <dt className="font-semibold text-slate-700">{label}</dt>
      <dd className="text-slate-600">{value}</dd>
    </div>
  );
}
