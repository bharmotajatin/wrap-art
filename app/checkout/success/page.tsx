import Link from "next/link";

export default function SuccessPage({ searchParams }: { searchParams: { orderNumber?: string } }) {
  return (
    <div className="glass rounded-3xl p-8">
      <h1 className="text-3xl font-semibold">Order confirmed</h1>
      <p className="mt-2">Order number {searchParams.orderNumber}</p>
      <div className="mt-4 flex gap-3">
        <Link href="/track-order">Track order</Link>
        <Link href="/collections/mobile-skins">Continue shopping</Link>
      </div>
    </div>
  );
}
