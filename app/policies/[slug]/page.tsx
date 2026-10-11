export default function Policy({ params }: { params: { slug: string } }) {
  return <article><h1 className="text-3xl font-semibold capitalize">{params.slug.replace("-", " ")}</h1><p className="mt-3">Orders above ₹999 ship free. COD is available on eligible pins.</p></article>;
}
