import { NextRequest, NextResponse } from 'next/server'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    // Mock data for now - will integrate with backend when gravestone endpoints are added
    const gravestones: any[] = []
    
    return NextResponse.json({
      success: true,
      data: gravestones
    })
  } catch (error) {
    console.error('Error fetching gravestones:', error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating gravestone:', body)
    
    // Mock response - will integrate with backend when gravestone endpoints are added
    const mockGravestone = {
      id: Date.now(),
      plotId: body.plotId,
      material: body.material,
      inscription: body.inscription,
      dateInstalled: body.dateInstalled,
      condition: body.condition,
      height: body.height,
      width: body.width,
      thickness: body.thickness,
      manufacturer: body.manufacturer,
      deceasedInfo: body.deceasedInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: mockGravestone
    })
  } catch (error) {
    console.error('Error creating gravestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create gravestone' }, 
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body
    
    console.log('Updating gravestone:', id, updateData)
    
    // Mock response - will integrate with backend when gravestone endpoints are added
    const mockGravestone = {
      id: parseInt(id),
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: mockGravestone
    })
  } catch (error) {
    console.error('Error updating gravestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update gravestone' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Gravestone ID is required' },
        { status: 400 }
      )
    }
    
    console.log('Deleting gravestone:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Gravestone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting gravestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete gravestone' }, 
      { status: 500 }
    )
  }
}