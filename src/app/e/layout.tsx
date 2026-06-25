export const metadata = {
  title: "Hookit Events",
  description: "Book tickets for amazing events",
};

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <script
        src="https://checkout.razorpay.com/v1/checkout.js"
        async
      />
    </>
  );
}