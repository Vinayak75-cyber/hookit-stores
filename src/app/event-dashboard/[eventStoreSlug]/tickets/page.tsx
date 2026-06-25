import { redirect } from "next/navigation";

export default function TicketsPage({
  params,
}: {
  params: { eventStoreSlug: string };
}) {
  redirect(`/event-dashboard/${params.eventStoreSlug}/events`);
}