import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"

const ASSET_INVENTORY_SERVICE_URL = process.env.ASSET_INVENTORY_SERVICE_URL || "http://localhost:3003"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const response = await fetch(
      `${ASSET_INVENTORY_SERVICE_URL}/api/storage/racks/${params.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error updating storage rack:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const response = await fetch(
      `${ASSET_INVENTORY_SERVICE_URL}/api/storage/racks/${params.id}`,
      {
        method: "DELETE",
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error deleting storage rack:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
