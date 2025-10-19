import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

/**
 * Burial Assignment API
 * 
 * This endpoint handles the complete burial assignment process:
 * 1. Creates a deceased record if needed
 * 2. Assigns the plot to the deceased
 * 
 * This provides a unified API for both Cemetery Management and Plot Management pages
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Burial Assignment API Called ===')
    
    // For development, always use test-token
    const authToken = 'test-token'
    console.log('Using auth token:', authToken)

    const body = await request.json()
    console.log('Burial assignment request body:', JSON.stringify(body, null, 2))

    // Validate required fields
    const { plotId, deceased, permitId, notes, layer } = body
    
    if (!plotId || !deceased) {
      return NextResponse.json(
        { success: false, error: 'Plot ID and deceased information are required' },
        { status: 400 }
      )
    }

    // Validate deceased data
    if (!deceased.firstName || !deceased.lastName || !deceased.dateOfBirth || !deceased.dateOfDeath) {
      return NextResponse.json(
        { success: false, error: 'Deceased first name, last name, date of birth, and date of death are required' },
        { status: 400 }
      )
    }

    // First, create the deceased record
    const deceasedPayload = {
      firstName: deceased.firstName,
      lastName: deceased.lastName,
      middleName: deceased.middleName || '',
      dateOfBirth: deceased.dateOfBirth,
      dateOfDeath: deceased.dateOfDeath,
      gender: deceased.gender || 'male',
      causeOfDeath: deceased.causeOfDeath || '',
      occupation: deceased.occupation || '',
      placeOfDeath: deceased.placeOfDeath || '',
      residenceAddress: deceased.residenceAddress || '',
      citizenship: deceased.citizenship || 'Filipino',
      civilStatus: deceased.civilStatus || 'Single'
    }

    console.log('Creating deceased record:', deceasedPayload)

    const deceasedResponse = await fetch('http://localhost:3001/api/deceased', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deceasedPayload)
    })

    if (!deceasedResponse.ok) {
      console.error('Failed to create deceased record:', deceasedResponse.status)
      let errorData
      try {
        errorData = await deceasedResponse.json()
      } catch (e) {
        errorData = await deceasedResponse.text()
      }
      console.error('Deceased creation error:', errorData)
      
      return NextResponse.json(
        { success: false, error: 'Failed to create deceased record', details: errorData },
        { status: deceasedResponse.status }
      )
    }

    const deceasedResult = await deceasedResponse.json()
    console.log('Deceased record created:', deceasedResult)

    // Now assign the plot
    const assignmentPayload = {
      deceasedId: deceasedResult.data.id,
      permitId: permitId || null,
      notes: notes || `Burial assignment for ${deceased.firstName} ${deceased.lastName}${layer ? ` - Layer ${layer}` : ''}`
    }

    console.log('Assigning plot:', plotId, assignmentPayload)

    const assignmentResponse = await fetch(`http://localhost:3001/api/plots/${plotId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignmentPayload)
    })

    if (!assignmentResponse.ok) {
      console.error('Failed to assign plot:', assignmentResponse.status)
      let errorData
      try {
        errorData = await assignmentResponse.json()
      } catch (e) {
        errorData = await assignmentResponse.text()
      }
      console.error('Plot assignment error:', errorData)
      
      return NextResponse.json(
        { success: false, error: 'Failed to assign plot', details: errorData },
        { status: assignmentResponse.status }
      )
    }

    const assignmentResult = await assignmentResponse.json()
    console.log('Plot assignment successful:', assignmentResult)

    return NextResponse.json({
      success: true,
      data: {
        deceased: deceasedResult.data,
        assignment: assignmentResult.data.assignment,
        plot: assignmentResult.data.plot
      },
      message: `Successfully assigned plot to ${deceased.firstName} ${deceased.lastName}`
    })

  } catch (error) {
    console.error('=== Burial Assignment API Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process burial assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function calculateAge(dateOfBirth: string, dateOfDeath: string): number {
  const birth = new Date(dateOfBirth)
  const death = new Date(dateOfDeath)
  const ageInMs = death.getTime() - birth.getTime()
  return Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000))
}