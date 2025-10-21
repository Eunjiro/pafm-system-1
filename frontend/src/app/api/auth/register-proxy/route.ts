import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const backendUrl = process.env.BACKEND_URL || 'http://burial-cemetery:3001'
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Registration proxy error:', error)
    return NextResponse.json(
      { error: 'Registration failed', message: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
