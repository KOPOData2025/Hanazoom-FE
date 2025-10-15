import { NextResponse } from "next/server";
import { cookies } from "next/headers";


export async function GET() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 404 }
      );
    }


    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http:
      }/api/v1/members/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend refresh token error:", errorData);
      return NextResponse.json(
        { error: "Failed to refresh token" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data); 
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
