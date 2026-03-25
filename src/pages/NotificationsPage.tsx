import PageHeader from '@/components/dashboard/PageHeader';

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Notifications"
        title="No notifications yet."
        description="When friends add you, accept requests, or other account activity comes in, you will see it here."
      />

      <section className="rounded-2xl border border-[hsl(var(--golfer-line))] bg-white p-5 text-center shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)]">
        <p className="font-display text-xl text-[hsl(var(--golfer-deep))]">No active notifications</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
          Nothing new has come in yet. As your friends join GolfeR and start sharing activity with you, this page will
          fill in.
        </p>
      </section>
    </div>
  );
}
