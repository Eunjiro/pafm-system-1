import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' }, 
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/certificates/${id}/override`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute admin override');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin override API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}