import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/checkpoints?month=2025-01
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json({ error: "Month parameter is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const checkpoints = await prisma.checkpoint.findMany({
      where: {
        userId: user.id,
        date: {
          startsWith: month.substring(0, 7), // Get YYYY-MM part
        },
      },
    });

    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error("Error fetching checkpoints:", error);
    return NextResponse.json(
      { error: "Error fetching checkpoints" },
      { status: 500 }
    );
  }
}

// POST /api/checkpoints
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingCheckpoint = await prisma.checkpoint.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
    });

    if (existingCheckpoint) {
      // Toggle the checkpoint
      const updatedCheckpoint = await prisma.checkpoint.update({
        where: {
          id: existingCheckpoint.id,
        },
        data: {
          isCompleted: !existingCheckpoint.isCompleted,
        },
      });
      return NextResponse.json(updatedCheckpoint);
    } else {
      // Create new checkpoint
      const checkpoint = await prisma.checkpoint.create({
        data: {
          date,
          isCompleted: true,
          userId: user.id,
        },
      });
      return NextResponse.json(checkpoint);
    }
  } catch (error) {
    console.error("Error updating checkpoint:", error);
    return NextResponse.json(
      { error: "Error updating checkpoint" },
      { status: 500 }
    );
  }
} 