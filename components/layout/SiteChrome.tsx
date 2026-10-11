"use client";

import { formatInr } from "@/lib/pricing";
import { useShop } from "@/lib/store";
import { Menu, Search, ShoppingBag, Heart, User, X, Moon, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../ui/Toast";

type Category = { id: string; name: string; slug: string; parentId: string | null };

const announcements = [
  "Festive drop: WRAP10 for 10% off over ₹500",
  "Free shipping above ₹999",
  "Gold members get early access to new skins",
];

export function SiteChrome({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const session = useSession();
  const shop = useShop();
  const toast = useToast();
  const router = useRouter();
  const [hiddenBar, setHiddenBar] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ products: { title: string; slug: string }[]; collections: { name: string; slug: string }[] }>({ products: [], collections: [] });
  const [mobile, setMobile] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [announce, setAnnounce] = useState(0);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    setHiddenBar(localStorage.getItem("wrap-announce") === "1");
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAnnounce((n) => (n + 1) % announcements.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions({ products: [], collections: [] });
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setSuggestions(await res.json());
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const tree = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const count = shop.cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      {!hiddenBar && (
        <div className="relative overflow-hidden bg-[var(--fg)] text-[var(--bg)] text-sm">
          <p className="px-10 py-2 text-center">{announcements[announce]}</p>
          <button
            aria-label="Dismiss announcement"
            className="absolute right-3 top-2"
            onClick={() => {
              localStorage.setItem("wrap-announce", "1");
              setHiddenBar(true);
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-40 glass glass-lite">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button className="md:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <Link href="/" className="text-lg font-semibold tracking-tight">Wrap Art</Link>
          <nav className="hidden items-center gap-4 md:flex">
            {tree.map((cat) => (
              <div key={cat.id} className="group relative">
                <Link href={`/collections/${cat.slug}`} className="text-sm">{cat.name}</Link>
                <div className="invisible absolute left-0 top-full z-20 min-w-52 pt-2 opacity-0 group-hover:visible group-hover:opacity-100">
                  <div className="glass rounded-2xl p-3 text-sm">
                    <Link href={`/collections/${cat.slug}`}>Shop all {cat.name}</Link>
                  </div>
                </div>
              </div>
            ))}
          </nav>
          <div className="relative ml-auto hidden w-64 md:block">
            <Search className="absolute left-3 top-2.5" size={16} />
            <input
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/search?q=${encodeURIComponent(query)}`)}
              placeholder="Search skins"
              className="w-full rounded-full border border-[var(--glass-border)] bg-transparent py-2 pl-9 pr-3 text-sm"
            />
            {(suggestions.products.length > 0 || suggestions.collections.length > 0) && (
              <div className="glass absolute mt-2 w-full rounded-2xl p-2 text-sm">
                {suggestions.collections.map((c) => (
                  <Link key={c.slug} className="block rounded-lg px-2 py-1" href={`/collections/${c.slug}`} onClick={() => setQuery("")}>
                    Collection · {c.name}
                  </Link>
                ))}
                {suggestions.products.map((p) => (
                  <Link key={p.slug} className="block rounded-lg px-2 py-1" href={`/products/${p.slug}`} onClick={() => setQuery("")}>
                    {p.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button aria-label="Toggle color mode" onClick={() => { setDark((v) => !v); document.documentElement.classList.toggle("dark"); }}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button aria-label="Account" onClick={() => setAccountOpen((v) => !v)}><User size={18} /></button>
            {accountOpen && (
              <div className="glass absolute right-0 mt-2 w-44 rounded-2xl p-2 text-sm">
                {session.data?.user ? (
                  <>
                    <Link className="block px-2 py-1" href="/account">Account</Link>
                    <Link className="block px-2 py-1" href="/account/orders">Orders</Link>
                    {session.data.user.role === "admin" && <Link className="block px-2 py-1" href="/admin">Admin</Link>}
                    <button className="block w-full px-2 py-1 text-left" onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link className="block px-2 py-1" href="/login">Login</Link>
                    <Link className="block px-2 py-1" href="/register">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>
          <Link href="/wishlist" aria-label="Wishlist" className="relative">
            <Heart size={18} />
            <span className="absolute -right-2 -top-2 rounded-full bg-[var(--accent)] px-1 text-[10px] text-white">{shop.wishlist.length}</span>
          </Link>
          <button aria-label="Open cart" className="relative" onClick={() => shop.setDrawer(true)}>
            <ShoppingBag size={18} />
            <span className="absolute -right-2 -top-2 rounded-full bg-[var(--accent)] px-1 text-[10px] text-white">{count}</span>
          </button>
        </div>
      </header>
      {mobile && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobile(false)}>
          <aside className="glass h-full w-80 p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Mobile menu">
            <button aria-label="Close menu" onClick={() => setMobile(false)}><X /></button>
            {tree.map((cat) => (
              <div key={cat.id} className="mt-3">
                <button className="font-medium" onClick={() => setOpenGroups((g) => g.includes(cat.id) ? g.filter((id) => id !== cat.id) : [...g, cat.id])}>
                  {cat.name}
                </button>
                {openGroups.includes(cat.id) && (
                  <Link className="block pl-3 text-sm" href={`/collections/${cat.slug}`} onClick={() => setMobile(false)}>View collection</Link>
                )}
              </div>
            ))}
            <div className="mt-6 flex gap-3 text-sm">
              <Link href="/account">Account</Link>
              <Link href="/wishlist">Wishlist</Link>
              <button onClick={() => { setMobile(false); shop.setDrawer(true); }}>Cart</button>
            </div>
          </aside>
        </div>
      )}
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email");
              const res = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
              toast(res.ok ? "You are on the list." : "Check the email and try again.");
              if (res.ok) e.currentTarget.reset();
            }}
          >
            <p className="font-medium">Newsletter</p>
            <div className="mt-2 flex gap-2">
              <input name="email" type="email" required placeholder="Email" className="w-full rounded-full border px-3 py-2 text-sm" />
              <button className="rounded-full bg-[var(--fg)] px-4 text-sm text-[var(--bg)]">Join</button>
            </div>
          </form>
          <div className="text-sm">
            <Link className="block" href="/about">About</Link>
            <Link className="block" href="/faq">FAQ</Link>
            <Link className="block" href="/contact">Contact</Link>
            <Link className="block" href="/policies/shipping">Shipping policy</Link>
            <Link className="block" href="/track-order">Track order</Link>
          </div>
          <div className="text-sm text-[var(--muted)]">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <p className="mt-2">UPI · Cards · Netbanking · COD</p>
          </div>
        </div>
      </footer>
      {showTop && (
        <button className="glass fixed bottom-4 left-4 rounded-full px-3 py-2 text-sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </button>
      )}
      {shop.drawerOpen && <CartPanel />}
    </>
  );
}

function CartPanel() {
  const shop = useShop();
  const toast = useToast();
  const subtotal = shop.cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={() => shop.setDrawer(false)}>
      <aside className="glass ml-auto h-full w-[min(100%,24rem)] p-4" role="dialog" aria-label="Cart" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cart</h2>
          <button aria-label="Close cart" onClick={() => shop.setDrawer(false)}><X /></button>
        </div>
        {shop.cart.length === 0 ? (
          <p className="mt-8 text-sm">Your cart is empty. <Link className="underline" href="/collections/mobile-skins">Shop skins</Link></p>
        ) : (
          <ul className="mt-4 space-y-3">
            {shop.cart.map((line) => (
              <li key={line.variantId} className="flex gap-3 text-sm">
                <div>
                  <p className="font-medium">{line.title}</p>
                  <p className="text-[var(--muted)]">{line.deviceModel} · {line.color}</p>
                  <p>{formatInr(line.unitPrice)} × {line.quantity}</p>
                  <button
                    onClick={() => {
                      shop.remove(line.variantId);
                      toast("Removed from cart", { label: "Undo", onClick: () => shop.restore(line) });
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 font-medium">Subtotal {formatInr(subtotal)}</p>
        <Link href="/cart" className="mt-3 block text-center text-sm underline" onClick={() => shop.setDrawer(false)}>View cart</Link>
        <Link href="/checkout" className="mt-3 block rounded-full bg-[var(--fg)] py-2 text-center text-sm text-[var(--bg)]" onClick={() => shop.setDrawer(false)}>
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
