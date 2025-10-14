import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 })
    }

    // Try to search in the backend burial-cemetery service
    try {
      const response = await fetch(`${BACKEND_URL}/api/plots/search?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const backendResults = await response.json()
        
        // Transform backend data to match frontend interface
        const results = (backendResults.data || []).map((plot: any) => ({
          id: plot.id.toString(),
          deceasedName: plot.deceased_name || `${plot.deceased_first_name || ''} ${plot.deceased_last_name || ''}`.trim() || 'Unknown',
          firstName: plot.deceased_first_name || '',
          lastName: plot.deceased_last_name || '',
          dateOfBirth: plot.deceased_date_of_birth || '1900-01-01',
          dateOfDeath: plot.deceased_date_of_death || '1900-01-01',
          burialDate: plot.burial_date || plot.deceased_date_of_death || '1900-01-01',
          age: plot.deceased_age || 0,
          gender: plot.deceased_gender || 'unknown',
          plotLocation: {
            section: plot.section || 'Unknown',
            block: plot.block || 'Unknown',
            plotNumber: plot.plot_number || 'Unknown',
            coordinates: [
              parseFloat(plot.position_x) || 14.6760,
              parseFloat(plot.position_y) || 121.0437
            ] as [number, number]
          },
          gravestone: plot.gravestone_material ? {
            material: plot.gravestone_material,
            inscription: plot.gravestone_inscription || '',
            condition: plot.gravestone_condition || 'good'
          } : undefined,
          permitNumber: plot.permit_number,
          registrationNumber: plot.registration_number
        }))
        
        return NextResponse.json({
          success: true,
          results
        })
      }
    } catch (backendError) {
      console.warn('Backend search failed, using mock data:', backendError)
    }

    // Fallback mock data for demonstration
    const mockResults = [
      {
        id: '1',
        deceasedName: 'Maria Santos',
        firstName: 'Maria',
        lastName: 'Santos',
        dateOfBirth: '1950-03-15',
        dateOfDeath: '2020-08-22',
        burialDate: '2020-08-25',
        age: 70,
        gender: 'female',
        plotLocation: {
          section: 'Section A',
          block: 'Block 1',
          plotNumber: 'A1-001',
          coordinates: [14.6760, 121.0437] as [number, number]
        },
        gravestone: {
          material: 'Granite',
          inscription: 'Beloved Wife and Mother - Rest in Peace',
          condition: 'good'
        },
        permitNumber: 'P-2020-001',
        registrationNumber: 'R-2020-001'
      },
      {
        id: '2',
        deceasedName: 'Juan Dela Cruz',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        dateOfBirth: '1945-12-03',
        dateOfDeath: '2019-05-14',
        burialDate: '2019-05-17',
        age: 73,
        gender: 'male',
        plotLocation: {
          section: 'Section B',
          block: 'Block 2',
          plotNumber: 'B2-025',
          coordinates: [14.6765, 121.0442] as [number, number]
        },
        gravestone: {
          material: 'Marble',
          inscription: 'Loving Father - Forever in our Hearts',
          condition: 'excellent'
        },
        permitNumber: 'P-2019-045',
        registrationNumber: 'R-2019-045'
      },
      {
        id: '3',
        deceasedName: 'Ana Rodriguez',
        firstName: 'Ana',
        lastName: 'Rodriguez',
        dateOfBirth: '1960-07-20',
        dateOfDeath: '2021-11-10',
        burialDate: '2021-11-13',
        age: 61,
        gender: 'female',
        plotLocation: {
          section: 'Garden Area',
          block: 'Memorial Block',
          plotNumber: 'G1-012',
          coordinates: [14.6755, 121.0440] as [number, number]
        },
        gravestone: {
          material: 'Bronze',
          inscription: 'Cherished Mother and Grandmother',
          condition: 'good'
        },
        permitNumber: 'P-2021-078',
        registrationNumber: 'R-2021-078'
      }
    ]

    // Filter results based on search query
    const filteredResults = mockResults.filter(result => 
      result.deceasedName.toLowerCase().includes(query.toLowerCase()) ||
      result.firstName.toLowerCase().includes(query.toLowerCase()) ||
      result.lastName.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json({
      success: true,
      results: filteredResults
    })
  } catch (error) {
    console.error('Cemetery search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search cemetery records'
    }, { status: 500 })
  }
}