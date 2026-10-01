import { NextRequest, NextResponse } from "next/server";

// .replace strips BOM that PowerShell can inject when piping env vars
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:5000"
).replace(/^﻿/, "").trim();

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const url = `${API_BASE}/${path.join("/")}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    let body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.text()
        : undefined;

    // Ensure description is never null/empty for the create-order endpoint
    // (backend validator still has NotEmpty until Railway deploys the fix)
    if (req.method === "POST" && path.join("/") === "api/serviceorders" && body) {
      try {
        const parsed = JSON.parse(body);
        if (!parsed.description?.trim()) parsed.description = "—";
        body = JSON.stringify(parsed);
      } catch {}
    }

    const upstream = await fetch(url, { method: req.method, headers, body });
    const data = await upstream.text();

    return new NextResponse(data, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
