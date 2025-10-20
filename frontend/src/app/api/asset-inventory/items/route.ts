import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const ASSET_INVENTORY_SERVICE_URL = process.env.ASSET_INVENTORY_SERVICE_URL || "http://localhost:3003"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let queryString = ''
    const params = []
    
    if (category) params.push(`category=${category}`)
    if (status) params.push(`status=${status}`)
    if (search) params.push(`search=${search}`)
    
    if (params.length > 0) {
      queryString = `?${params.join('&')}`
    }

    const response = await fetch(`${ASSET_INVENTORY_SERVICE_URL}/api/items${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const response = await fetch(`${ASSET_INVENTORY_SERVICE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
