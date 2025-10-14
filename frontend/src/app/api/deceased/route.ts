import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all deceased records (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const deceased = await prisma.deceasedRecord.findMany({
      where,
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json({ success: true, data: deceased });
  } catch (error) {
    console.error("Deceased records fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deceased records" },
      { status: 500 }
    );
  }
}

// Create deceased record (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.dateOfDeath) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, last name, date of birth, and date of death are required",
        },
        { status: 400 }
      );
    }

    // Calculate age if not provided
    const age = body.age || Math.floor((new Date(body.dateOfDeath).getTime() - new Date(body.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const deceased = await prisma.deceasedRecord.create({
      data: {
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        suffix: body.suffix,
        dateOfBirth: new Date(body.dateOfBirth),
        dateOfDeath: new Date(body.dateOfDeath),
        age: age,
        sex: body.gender || body.sex, // Support both field names
        causeOfDeath: body.causeOfDeath,
        placeOfDeath: body.placeOfDeath,
        residenceAddress: body.residenceAddress,
        citizenship: body.citizenship,
        civilStatus: body.civilStatus,
        occupation: body.occupation,
        covidRelated: body.covidRelated || false,
      },
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      }
    });

    // If plotId is provided, create a plot assignment
    if (body.plotId) {
      await prisma.plotAssignment.create({
        data: {
          plotId: parseInt(body.plotId),
          deceasedId: deceased.id,
          status: 'ASSIGNED'
        }
      });

      // Update plot status to occupied
      await prisma.cemeteryPlot.update({
        where: { id: parseInt(body.plotId) },
        data: { 
          status: 'OCCUPIED'
        }
      });
    }

    return NextResponse.json({ success: true, data: deceased });
  } catch (error) {
    console.error("Deceased record create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create deceased record" },
      { status: 500 }
    );
  }
}

// Update deceased record (PUT)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Deceased ID is required" },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateOfDeath) {
      updateData.dateOfDeath = new Date(updateData.dateOfDeath);
    }

    const deceased = await prisma.deceasedRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: deceased });
  } catch (error) {
    console.error("Deceased record update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deceased record" },
      { status: 500 }
    );
  }
}

// Delete deceased record (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Deceased ID is required" },
        { status: 400 }
      );
    }

    // Get the deceased record and find associated plot assignments
    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      }
    });

    if (deceased && deceased.plotAssignments.length > 0) {
      // Update plot status to vacant and remove assignments
      for (const assignment of deceased.plotAssignments) {
        await prisma.cemeteryPlot.update({
          where: { id: assignment.plotId },
          data: { 
            status: 'VACANT'
          }
        });
        
        await prisma.plotAssignment.delete({
          where: { id: assignment.id }
        });
      }
    }

    await prisma.deceasedRecord.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Deceased record deleted successfully" });
  } catch (error) {
    console.error("Deceased record delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete deceased record" },
      { status: 500 }
    );
  }
}