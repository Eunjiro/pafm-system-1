import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Database connectivity test via backend service
export async function GET(request: NextRequest) {
  try {
    // Test backend service health which includes database connectivity
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: "Backend and database connection successful",
      timestamp: new Date().toISOString(),
      backend: data
    });
  } catch (error) {
    console.error("Backend connection error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown backend error';
    
    return NextResponse.json({
      success: false,
      error: "Backend connection failed",
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}