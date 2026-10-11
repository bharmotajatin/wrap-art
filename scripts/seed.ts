import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../lib/db/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

const models: { brand: string; modelName: string }[] = [];
const apple = ["11", "12", "13", "14", "15", "16"].flatMap((n) => [
  `iPhone ${n}`,
  `iPhone ${n} Pro`,
  `iPhone ${n} Pro Max`,
]);
apple.forEach((modelName) => models.push({ brand: "Apple", modelName }));
["S21", "S22", "S23", "S24", "S25", "A54", "A55", "Z Flip 5", "Z Fold 5"].forEach((m) =>
  models.push({ brand: "Samsung", modelName: `Galaxy ${m}` }),
);
["11", "12", "12R", "Nord 3", "Nord CE 4"].forEach((m) =>
  models.push({ brand: "OnePlus", modelName: `OnePlus ${m}` }),
);
["13", "14", "Note 13"].forEach((m) => models.push({ brand: "Xiaomi", modelName: `Redmi ${m}` }));
["Pixel 7", "Pixel 8", "Pixel 9"].forEach((modelName) => models.push({ brand: "Google", modelName }));

const colors = ["Obsidian", "Frost", "Crimson", "Sage"];

async function main() {
  await client.execute("PRAGMA foreign_keys = OFF");
  for (const table of [
    "wishlist_alerts",
    "newsletter_subscribers",
    "return_requests",
    "memberships",
    "membership_plans",
    "reviews",
    "order_tracking_events",
    "order_items",
    "orders",
    "coupons",
    "wishlists",
    "cart_items",
    "carts",
    "inventory_logs",
    "product_variants",
    "product_images",
    "products",
    "device_models",
    "categories",
    "addresses",
    "password_reset_tokens",
    "verification_tokens",
    "sessions",
    "accounts",
    "users",
  ]) {
    await client.execute(`DELETE FROM ${table}`);
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "Wrap Admin",
      email: "admin@wrapart.test",
      passwordHash,
      phone: "9999999999",
      role: "admin",
      isGoldMember: true,
    })
    .returning();
  await db.insert(schema.users).values({
    name: "Asha Mehta",
    email: "asha@wrapart.test",
    passwordHash,
    phone: "9876543210",
    role: "customer",
  });

  const cats = await db
    .insert(schema.categories)
    .values([
      { name: "Mobile Skins", slug: "mobile-skins", sortOrder: 1, imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80" },
      { name: "Screen Guards", slug: "screen-guards", sortOrder: 2, imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80" },
      { name: "Laptop Skins", slug: "laptop-skins", sortOrder: 3, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
      { name: "Chargers & Cards", slug: "chargers-cards", sortOrder: 4, imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80" },
    ])
    .returning();

  const deviceRows = await db.insert(schema.deviceModels).values(models).returning();

  const catalog = [
    { title: "Midnight Marble Skin", slug: "midnight-marble-skin", brand: "3M", material: "Vinyl", texture: "Matte", price: 79900, compare: 129900, cat: 0, featured: true },
    { title: "ChromeX Mirror Skin", slug: "chromex-mirror-skin", brand: "ChromeX", material: "Metal film", texture: "Gloss", price: 99900, compare: 149900, cat: 0, featured: true },
    { title: "Sage Linen Skin", slug: "sage-linen-skin", brand: "3M", material: "Textile vinyl", texture: "Linen", price: 89900, compare: 119900, cat: 0, featured: false },
    { title: "Privacy Glass Guard", slug: "privacy-glass-guard", brand: "GuardLab", material: "Tempered glass", texture: "Smooth", price: 49900, compare: 79900, cat: 1, featured: true },
    { title: "Matte Laptop Wrap", slug: "matte-laptop-wrap", brand: "3M", material: "Vinyl", texture: "Matte", price: 149900, compare: 199900, cat: 2, featured: true },
    { title: "Cable Organizer Kit", slug: "cable-organizer-kit", brand: "WrapArt", material: "Silicone", texture: "Soft", price: 69900, compare: 99900, cat: 3, featured: false },
    { title: "Metal Card Skin", slug: "metal-card-skin", brand: "ChromeX", material: "Metal", texture: "Brushed", price: 39900, compare: 59900, cat: 3, featured: false },
    { title: "Bumper Cover Frost", slug: "bumper-cover-frost", brand: "WrapArt", material: "TPU", texture: "Frosted", price: 59900, compare: 89900, cat: 0, featured: false },
  ];

  for (const item of catalog) {
    const [product] = await db
      .insert(schema.products)
      .values({
        title: item.title,
        slug: item.slug,
        description: `${item.title} is precision-cut for daily carry. ${item.material} with a ${item.texture.toLowerCase()} finish, residue-free removal, and edge-to-edge coverage.`,
        basePrice: item.price,
        compareAtPrice: item.compare,
        categoryId: cats[item.cat].id,
        brandTag: item.brand,
        material: item.material,
        texture: item.texture,
        isFeatured: item.featured,
        avgRating: 46,
        reviewCount: 12,
        seoTitle: `${item.title} | Wrap Art`,
        seoDescription: `Shop ${item.title} with model-specific cuts.`,
      })
      .returning();

    await db.insert(schema.productImages).values([
      { productId: product.id, url: `https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80&sig=${item.slug}`, altText: item.title, sortOrder: 0 },
      { productId: product.id, url: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80&sig=${item.slug}-2`, altText: `${item.title} alternate`, sortOrder: 1, color: "Obsidian" },
    ]);

    const sampleModels = deviceRows.filter((d) => ["Apple", "Samsung"].includes(d.brand)).slice(0, 12);
    const variants = sampleModels.flatMap((model, i) =>
      colors.slice(0, 3).map((color, c) => ({
        productId: product.id,
        deviceModelId: model.id,
        deviceModel: `${model.brand} ${model.modelName}`,
        color,
        sku: `${item.slug.slice(0, 8).toUpperCase()}-${i}${c}`,
        stock: color === "Crimson" && i === 0 ? 0 : 8 + ((i + c) % 6),
        priceOverride: c === 2 ? item.price + 5000 : null,
      })),
    );
    await db.insert(schema.productVariants).values(variants);
  }

  await db.insert(schema.coupons).values([
    { code: "WRAP10", type: "percent", value: 10, minCartValue: 50000, maxUses: 1000 },
    { code: "BOGO", type: "bogo", value: 1, minCartValue: 0, maxUses: 500 },
    { code: "FLAT200", type: "flat", value: 20000, minCartValue: 99900, maxUses: 200 },
  ]);

  await db.insert(schema.membershipPlans).values({
    name: "Gold Membership",
    price: 99900,
    durationMonths: 12,
    perks: JSON.stringify(["Free shipping all year", "Early drops", "10% member pricing", "Priority replacements"]),
  });

  await db.insert(schema.reviews).values({
    productId: (await db.select().from(schema.products).limit(1))[0].id,
    userId: admin.id,
    rating: 5,
    title: "Clean edges",
    body: "The cut hugged the camera island and the matte finish hides fingerprints.",
    isApproved: true,
  });

  await client.execute("PRAGMA foreign_keys = ON");
  console.log(`Seeded ${models.length} device models and ${catalog.length} products.`);
  console.log("Login: admin@wrapart.test / password123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
