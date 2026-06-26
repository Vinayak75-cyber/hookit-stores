// app/store/[slug]/page.tsx
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/stores?slug=${slug}`,
    { cache: "no-store" }
  );

  const { store } = await res.json();

  if (!store) {
    notFound();
  }

  return (
    <div>
      <h1>{store.name}</h1>
      <p>{store.description}</p>
      {/* Your store UI here */}
    </div>
  );
}