import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get the backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    // Try to ping the backend
    console.log(`Pinging backend at ${backendUrl}`);

    // Fetch with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${backendUrl}/`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({
        status: "success",
        message: "Backend connection successful",
        backendUrl,
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: `Backend returned status ${response.status}`,
          backendUrl,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error connecting to backend:", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        backendUrl,
      },
      { status: 500 }
    );
  }
}
