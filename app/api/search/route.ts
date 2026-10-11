import { searchSuggestions } from "@/lib/catalog";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json(await searchSuggestions(q));
}
