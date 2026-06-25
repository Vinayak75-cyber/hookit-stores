import EventDashboardShell from "@/components/events/EventDashboardShell";

export default function EventDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EventDashboardShell>{children}</EventDashboardShell>;
}