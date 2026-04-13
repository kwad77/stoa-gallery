import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const a = url.searchParams.get("a");
  const b = url.searchParams.get("b");
  if (!a || !b) {
    return NextResponse.redirect(new URL("/compare", url));
  }
  return NextResponse.redirect(new URL(`/compare/${a}/${b}`, url));
}
