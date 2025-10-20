import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const BURIAL_CEMETERY_SERVICE_URL = process.env.BURIAL_CEMETERY_SERVICE_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only allow admin users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const response = await fetch(`${BURIAL_CEMETERY_SERVICE_URL}/api/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log('[Cemetery-Burial Dashboard API] Response status:', response.status)
    console.log('[Cemetery-Burial Dashboard API] Backend URL:', BURIAL_CEMETERY_SERVICE_URL)

    if (!response.ok) {
      console.error('[Cemetery-Burial Dashboard API] Backend response not OK:', response.status, response.statusText)
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend service error: ${response.status} ${response.statusText}`,
          details: `Failed to connect to ${BURIAL_CEMETERY_SERVICE_URL}/api/dashboard`
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Cemetery-Burial Dashboard API] Backend data received:', data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error fetching cemetery-burial dashboard data:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to connect to backend service",
        details: errorMessage,
        hint: "Make sure the burial-cemetery service is running on port 3001"
      },
      { status: 500 }
    )
  }
}
