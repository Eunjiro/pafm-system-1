import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CITIZEN PERMITS API: POST /api/citizen/permits ===');
    
    const session = await getServerSession(authOptions)
    
    // Allow access for development with test session
    if (!session) {
      console.log('No session found - creating test session for development');
    }
    
    // Use test authentication for development
    const authToken = session?.accessToken || 'test-token';
    const userId = session?.user?.id || '1';

    const formData = await request.formData()
    console.log('FormData received, extracting fields...');
    
    // Extract the main permit data
    const permitType = formData.get('permitType') as string
    const deceasedId = formData.get('deceasedId') as string
    const requestedDate = formData.get('requestedDate') as string
    const requestedTime = formData.get('requestedTime') as string
    const plotPreference = formData.get('plotPreference') as string
    const specialRequests = formData.get('specialRequests') as string
    const contactPerson = formData.get('contactPerson') as string
    const contactNumber = formData.get('contactNumber') as string
    const submittedBy = formData.get('submittedBy') as string

    console.log('Extracted permit data:', {
      permitType,
      deceasedId,
      requestedDate,
      contactPerson,
      contactNumber
    });

    // Validate required fields
    if (!permitType || !deceasedId || !contactPerson || !contactNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: permitType, deceasedId, contactPerson, and contactNumber are required' },
        { status: 400 }
      )
    }

    // Prepare the permit data for the backend
    const permitData = {
      permitType: permitType.toUpperCase(),
      deceasedId: parseInt(deceasedId),
      requestedDate,
      requestedTime,
      plotPreference,
      specialRequests,
      contactPerson,
      contactNumber,
      submittedBy: submittedBy ? parseInt(submittedBy) : parseInt(userId),
      remarks: `Submitted by citizen through online portal. Contact: ${contactPerson} (${contactNumber})`
    }

    console.log('Sending permit data to backend:', permitData);

    // Submit to backend using the same FormData approach as the direct API
    const backendFormData = new FormData()
    backendFormData.append('permitType', permitType.toUpperCase())
    backendFormData.append('deceasedId', deceasedId)
    backendFormData.append('requestedDate', requestedDate || '')
    backendFormData.append('requestedTime', requestedTime || '')
    backendFormData.append('plotPreference', plotPreference || '')
    backendFormData.append('specialRequests', specialRequests || '')
    backendFormData.append('contactPerson', contactPerson)
    backendFormData.append('contactNumber', contactNumber)

    // Add documents to the backend FormData
    const documentTypes = ['death_certificate', 'valid_id', 'burial_contract', 'medical_certificate']
    let documentsAdded = 0
    
    for (const docType of documentTypes) {
      const file = formData.get(`document_${docType}`) as File
      if (file) {
        console.log(`Adding document: ${docType} - ${file.name}`);
        backendFormData.append(`document_${docType}`, file)
        backendFormData.append(`documentType_${docType}`, docType)
        documentsAdded++
      }
    }

    console.log(`Added ${documentsAdded} documents to backend request`);

    // Submit to backend
    const response = await fetch(`${BACKEND_URL}/api/permits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: backendFormData,
    })

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to create permit request' },
        { status: response.status }
      )
    }

    const permit = await response.json()
    console.log('Backend success:', permit.success);

    return NextResponse.json({
      success: true,
      data: permit.data,
      message: permit.message || 'Permit request submitted successfully'
    })

  } catch (error) {
    console.error('Error creating citizen permit request:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}