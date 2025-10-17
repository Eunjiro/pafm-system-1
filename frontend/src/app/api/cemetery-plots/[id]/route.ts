import { NextRequest, NextResponse } from 'next/server'

// Mock data for cemetery plots (same as the main endpoint)
let plots = [
  {
    id: "1",
    name: "Section A - Block 1 - Lot 001",
    section: "A",
    block: "1",
    lot: "001",
    plot_code: "SEC-A-BLK-1-LOT-001",
    coordinates: [14.6760, 121.0437],
    status: "occupied",
    size: "2m x 1m",
    occupant: "Juan Dela Cruz",
    dateOccupied: "2023-01-15",
    notes: "Family plot",
    cemetery_name: "Bagbag Cemetery",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Section A - Block 1 - Lot 002",
    section: "A",
    block: "1",
    lot: "002",
    plot_code: "SEC-A-BLK-1-LOT-002",
    coordinates: [14.6761, 121.0437],
    status: "available",
    size: "2m x 1m",
    cemetery_name: "Bagbag Cemetery",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    name: "Section A - Block 1 - Lot 003",
    section: "A",
    block: "1",
    lot: "003",
    plot_code: "SEC-A-BLK-1-LOT-003",
    coordinates: [14.6762, 121.0437],
    status: "reserved",
    size: "2m x 1m",
    notes: "Reserved for Santos family",
    cemetery_name: "Bagbag Cemetery",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// GET: Fetch specific cemetery plot by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const plot = plots.find(p => p.id === id)
    
    if (!plot) {
      return NextResponse.json(
        { success: false, error: 'Plot not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: plot
    })
  } catch (error) {
    console.error('Error fetching plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plot' },
      { status: 500 }
    )
  }
}

// PUT: Update specific cemetery plot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { section, block, lot, coordinates, status, size, occupant, notes } = body
    
    const plotIndex = plots.findIndex(p => p.id === id)
    
    if (plotIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Plot not found' },
        { status: 404 }
      )
    }
    
    // Validate required fields
    if (!section || !block || !lot || !coordinates || !size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate plot code
    const plot_code = `SEC-${section}-BLK-${block}-LOT-${lot}`
    
    // Check if another plot already has this code (excluding current plot)
    const existingPlot = plots.find(p => p.plot_code === plot_code && p.id !== id)
    if (existingPlot) {
      return NextResponse.json(
        { success: false, error: 'Another plot with this section, block, and lot already exists' },
        { status: 409 }
      )
    }
    
    // Update plot
    const updatedPlot = {
      ...plots[plotIndex],
      name: `Section ${section} - Block ${block} - Lot ${lot}`,
      section,
      block,
      lot,
      plot_code,
      coordinates,
      status: status || 'available',
      size,
      occupant: occupant || undefined,
      notes: notes || undefined,
      updated_at: new Date().toISOString()
    }
    
    plots[plotIndex] = updatedPlot
    
    return NextResponse.json({
      success: true,
      data: updatedPlot,
      message: 'Plot updated successfully'
    })
  } catch (error) {
    console.error('Error updating plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plot' },
      { status: 500 }
    )
  }
}

// DELETE: Remove specific cemetery plot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const plotIndex = plots.findIndex(p => p.id === id)
    
    if (plotIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Plot not found' },
        { status: 404 }
      )
    }
    
    // Remove plot from array
    const deletedPlot = plots.splice(plotIndex, 1)[0]
    
    return NextResponse.json({
      success: true,
      data: deletedPlot,
      message: 'Plot deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete plot' },
      { status: 500 }
    )
  }
}