import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Proxy GET to backend /api/deceased
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let backendUrl = `${BACKEND_URL}/api/deceased`;
    if (search) {
      backendUrl += `?search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(backendUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch from backend');
    }

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error("Deceased records fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deceased records" },
      { status: 500 }
    );
  }
}

// Proxy POST to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/deceased`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create deceased record');
    }

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error("Deceased record create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create deceased record" },
      { status: 500 }
    );
  }
}

// Proxy PUT to backend
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/deceased`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update deceased record');
    }

    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error("Deceased record update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deceased record" },
      { status: 500 }
    );
  }
}

// Proxy DELETE to backend
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Deceased ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/deceased?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete deceased record');
    }

    return NextResponse.json({ success: true, message: "Deceased record deleted successfully" });
  } catch (error) {
    console.error("Deceased record delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete deceased record" },
      { status: 500 }
    );
  }
}