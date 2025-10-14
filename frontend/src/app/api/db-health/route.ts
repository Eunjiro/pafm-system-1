import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Database connectivity test
export async function GET(request: NextRequest) {
  try {
    // Try a simple query to test the connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database connection error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}