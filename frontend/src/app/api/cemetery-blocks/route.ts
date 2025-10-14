import { NextRequest, NextResponse } from 'next/server'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    // Mock data for now - will integrate with backend when block endpoints are added
    const blocks: any[] = []
    
    return NextResponse.json({
      success: true,
      data: blocks
    })
  } catch (error) {
    console.error('Error fetching cemetery blocks:', error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating cemetery block:', body)
    
    // Mock response - will integrate with backend when block endpoints are added
    const mockBlock = {
      id: Date.now(),
      name: body.name,
      sectionId: body.sectionId,
      coordinates: body.coordinates,
      maxPlots: body.maxPlots || body.capacity || 20,
      color: body.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: mockBlock
    })
  } catch (error) {
    console.error('Error creating cemetery block:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cemetery block' }, 
      { status: 500 }
    )
  }
}