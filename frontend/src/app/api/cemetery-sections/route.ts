import { NextRequest, NextResponse } from 'next/server'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    // Mock data for now - will integrate with backend when section endpoints are added
    const sections: any[] = []
    
    return NextResponse.json({
      success: true,
      data: sections
    })
  } catch (error) {
    console.error('Error fetching cemetery sections:', error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating cemetery section:', body)
    
    // Mock response - will integrate with backend when section endpoints are added
    const mockSection = {
      id: Date.now(),
      name: body.name,
      description: body.description,
      coordinates: body.coordinates,
      color: body.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: mockSection
    })
  } catch (error) {
    console.error('Error creating cemetery section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cemetery section' }, 
      { status: 500 }
    )
  }
}