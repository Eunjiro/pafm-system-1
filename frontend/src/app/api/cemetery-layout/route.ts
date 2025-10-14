import { NextRequest, NextResponse } from 'next/server'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    // Fetch plots from the backend to show current cemetery state
    const response = await fetch(`${BACKEND_URL}/api/cemetery-plots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch plots from backend')
    }
    
    const plots = await response.json()
    
    // Convert backend plot data to cemetery layout format
    return NextResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Main Cemetery',
        description: 'Cemetery with existing plots',
        totalArea: 10000,
        sections: [], // Will be populated based on existing plots
        plotsCount: plots.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching cemetery layout:', error)
    // Return mock data if backend is unavailable
    return NextResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Default Cemetery',
        description: 'Main cemetery layout',
        totalArea: 10000,
        sections: [],
        plotsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Processing cemetery layout:', body)
    
    // Extract all plots from the layout and create them in the backend
    const plots: any[] = []
    
    if (body.sections) {
      body.sections.forEach((section: any) => {
        if (section.blocks) {
          section.blocks.forEach((block: any) => {
            if (block.plots) {
              block.plots.forEach((plot: any) => {
                plots.push({
                  section: section.name,
                  block: block.name,
                  plot_number: plot.number,
                  position_x: plot.position?.x || 0,
                  position_y: plot.position?.y || 0,
                  size_width: plot.size?.width || 2,
                  size_length: plot.size?.length || 3,
                  status: 'available',
                  plot_type: 'standard'
                })
              })
            }
          })
        }
      })
    }
    
    console.log(`Creating ${plots.length} plots in backend...`)
    
    // Create plots in batches or individually
    let createdCount = 0
    for (const plot of plots) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/cemetery-plots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(plot)
        })
        
        if (response.ok) {
          createdCount++
        }
      } catch (error) {
        console.error('Error creating plot:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Cemetery layout processed. Created ${createdCount} plots.`,
        plotsCreated: createdCount,
        totalPlots: plots.length
      }
    })
  } catch (error) {
    console.error('Error processing cemetery layout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process cemetery layout' }, 
      { status: 500 }
    )
  }
}