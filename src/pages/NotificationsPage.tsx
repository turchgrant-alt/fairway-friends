import PageHeader from '@/components/dashboard/PageHeader';

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications are intentionally quiet in demo mode."
        description="This route stays available, but fake follows, comments, and engagement events are removed so the v1 product stays focused on course data and core flows."
      />

      <section className="rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white p-8 text-center shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] sm:p-12">
        <p className="font-display text-3xl text-[hsl(var(--golfer-deep))]">No active notifications</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-[hsl(var(--golfer-deep-soft))]/[0.74]">
          Social notification plumbing is not part of the current v1 demo. When real saved lists, reviews, or account
          activity come back, this page can be reintroduced without rebuilding the route structure.
        </p>
      </section>
    </div>
  );
}
