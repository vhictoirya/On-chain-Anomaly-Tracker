import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tx_hash = url.searchParams.get("tx_hash");
    const format = url.searchParams.get("format") || "json";

    if (!tx_hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 });
    }
    if (!tx_hash.startsWith("0x") || tx_hash.length !== 66) {
      return NextResponse.json({ error: "Invalid transaction hash format" }, { status: 400 });
    }

    const API_ENDPOINT = process.env.FASTAPI_BACKEND_URL || "http://localhost:8000";

    const response = await fetch(`${API_ENDPOINT}/analyze/transaction/${tx_hash}?format=${format}`, {
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
    console.error("Transaction analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze transaction" }, { status: 500 });
  }
}
