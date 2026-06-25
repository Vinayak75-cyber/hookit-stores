import { redirect } from "next/navigation";

export default function AttendeesPage({
  params,
}: {
  params: { eventStoreSlug: string };
}) {
  redirect(`/event-dashboard/${params.eventStoreSlug}/events`);
}