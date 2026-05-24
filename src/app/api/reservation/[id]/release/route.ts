import { releaseReservationById } from "@/lib/release-reservation";
import { ReservationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await releaseReservationById(id);

    if (!result) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (result.status === ReservationStatus.CONFIRMED) {
      return NextResponse.json(
        { error: "Cannot cancel a confirmed reservation" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Cannot release confirmed reservation"
    ) {
      return NextResponse.json(
        { error: "Cannot cancel a confirmed reservation" },
        { status: 400 }
      );
    }

    throw error;
  }
}
