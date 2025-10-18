import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      userRole: session?.user?.role,
      hasAccessToken: !!session?.accessToken,
      accessTokenPreview: session?.accessToken ? `${session.accessToken.substring(0, 20)}...` : null,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug session error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}