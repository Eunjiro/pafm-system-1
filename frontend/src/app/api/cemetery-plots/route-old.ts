import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
]

// GET: Fetch all cemetery plots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let filteredPlots = [...plots]
    
    // Filter by status
    if (status && status !== 'all') {
      filteredPlots = filteredPlots.filter(plot => plot.status === status)
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPlots = filteredPlots.filter(plot => 
        plot.name.toLowerCase().includes(searchLower) ||
        plot.section.toLowerCase().includes(searchLower) ||
        plot.block.toLowerCase().includes(searchLower) ||
        plot.lot.toLowerCase().includes(searchLower) ||
        (plot.occupant && plot.occupant.toLowerCase().includes(searchLower)) ||
        (plot.notes && plot.notes.toLowerCase().includes(searchLower))
      )
    }
    
    return NextResponse.json({
      success: true,
      data: filteredPlots,
      total: filteredPlots.length
    })
  } catch (error) {
    console.error('Error fetching plots:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plots' },
      { status: 500 }
    )
  }
}

// POST: Create a new cemetery plot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { section, block, lot, coordinates, status, size, occupant, notes } = body
    
    // Validate required fields
    if (!section || !block || !lot || !coordinates || !size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate plot code
    const plot_code = `SEC-${section}-BLK-${block}-LOT-${lot}`
    
    // Check if plot already exists
    const existingPlot = plots.find(p => p.plot_code === plot_code)
    if (existingPlot) {
      return NextResponse.json(
        { success: false, error: 'Plot with this section, block, and lot already exists' },
        { status: 409 }
      )
    }
    
    // Create new plot
    const newPlot = {
      id: Date.now().toString(),
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
      cemetery_name: "Bagbag Cemetery",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    plots.push(newPlot)
    
    return NextResponse.json({
      success: true,
      data: newPlot,
      message: 'Plot created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create plot' },
      { status: 500 }
    )
  }
}

// PUT: Update all plots (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { plots: updatedPlots } = body
    
    if (!Array.isArray(updatedPlots)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      )
    }
    
    // Update plots array
    plots = updatedPlots.map(plot => ({
      ...plot,
      updated_at: new Date().toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      data: plots,
      message: 'Plots updated successfully'
    })
  } catch (error) {
    console.error('Error updating plots:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plots' },
      { status: 500 }
    )
  }
}