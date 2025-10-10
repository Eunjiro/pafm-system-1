import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    if (!['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    const formData = await request.formData()
    
    // Extract the main registration data
    const registrationType = formData.get('registrationType') as string
    const deceasedData = JSON.parse(formData.get('deceased') as string)
    const informantName = formData.get('informantName') as string
    const informantRelationship = formData.get('informantRelationship') as string
    const informantContact = formData.get('informantContact') as string
    const submittedBy = formData.get('submittedBy') as string
    const amountDue = parseFloat(formData.get('amountDue') as string)

    // Prepare the registration data for the backend
    const registrationData = {
      registrationType,
      deceased: deceasedData,
      informantName,
      informantRelationship,
      informantContact,
      submittedBy: submittedBy ? parseInt(submittedBy) : session.user?.id,
      amountDue,
      remarks: 'Submitted by citizen through online portal'
    }

    // Submit to backend
    const response = await fetch(`${BACKEND_URL}/api/death-registrations/citizen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(registrationData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to create death registration' },
        { status: response.status }
      )
    }

    const registration = await response.json()

    // TODO: Handle document uploads here
    // For now, we'll just return the registration
    // In the future, this should:
    // 1. Upload documents to file storage
    // 2. Create document records in the database
    // 3. Link documents to the registration

    const documents = []
    const documentTypes = ['form_103', 'valid_id', 'covid_swab']
    
    for (const docType of documentTypes) {
      const file = formData.get(`document_${docType}`) as File
      if (file) {
        // Placeholder for document handling
        // In a real implementation, you would:
        // 1. Upload to file storage (S3, local filesystem, etc.)
        // 2. Create document record in database
        documents.push({
          type: docType,
          fileName: file.name,
          size: file.size,
          // filePath: uploadedFilePath,
          status: 'uploaded'
        })
      }
    }

    return NextResponse.json({
      ...registration,
      documents,
      message: 'Death registration submitted successfully. You will receive payment instructions via email.'
    })

  } catch (error) {
    console.error('Error creating citizen death registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}