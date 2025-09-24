import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get("address");
    const format = url.searchParams.get("format") || "json";

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    if (!address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json({ error: "Invalid Ethereum address format" }, { status: 400 });
    }

    const API_ENDPOINT = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";

    const response = await fetch(`${API_ENDPOINT}/analyze/address/${address}?format=${format}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Backend analysis failed: ${errorText}` }, { status: response.status });
    }

    if (format === "text") {
      const text = await response.text();
      return new NextResponse(text, { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Address analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze address" }, { status: 500 });
  }
}
