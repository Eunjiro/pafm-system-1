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

    // Handle document uploads
    console.log('Starting document upload process...')
    const uploadedDocuments = []
    const documentTypes = ['form_103', 'valid_id', 'covid_swab']
    
    for (const docType of documentTypes) {
      const file = formData.get(`document_${docType}`) as File
      if (file) {
        try {
          console.log(`Uploading document: ${docType}, file: ${file.name}`)
          
          // Create FormData for this specific document
          const docFormData = new FormData()
          docFormData.append('file', file)
          docFormData.append('registrationId', registration.id.toString())
          docFormData.append('docType', docType)
          
          // Upload to backend
          const uploadResponse = await fetch(`${BACKEND_URL}/api/death-registrations/${registration.id}/documents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
            body: docFormData
          })
          
          if (uploadResponse.ok) {
            const docResult = await uploadResponse.json()
            uploadedDocuments.push(docResult)
            console.log(`Document uploaded successfully: ${docType}`)
          } else {
            const errorText = await uploadResponse.text()
            console.error(`Failed to upload document ${docType}:`, errorText)
          }
        } catch (error) {
          console.error(`Error uploading document ${docType}:`, error)
        }
      }
    }

    return NextResponse.json({
      ...registration,
      documents: uploadedDocuments,
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