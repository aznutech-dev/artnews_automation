import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function forward(req: NextRequest, params: { path: string[] }) {
  const c = await cookies();
  const token = c.get("usnews_token")?.value;

  const path = "/" + params.path.join("/");
  const url = new URL(`/api${path}${req.nextUrl.search}`, API_URL).toString();

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  };

  const upstream = await fetch(url, init);
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("transfer-encoding");
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, await params);
}
