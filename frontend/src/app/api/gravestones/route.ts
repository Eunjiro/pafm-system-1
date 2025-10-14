import { NextRequest, NextResponse } from "next/server";

// Note: Gravestone functionality not available in current database schema
// This is a placeholder API that returns empty results

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [],
      message: "Gravestone functionality not available in current database schema"
    });
  } catch (error) {
    console.error("Gravestones API error:", error);
    return NextResponse.json(
      { success: false, error: "Gravestone functionality not available" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Gravestone functionality not available in current database schema" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Gravestone functionality not available in current database schema" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Gravestone functionality not available in current database schema" },
    { status: 501 }
  );
}