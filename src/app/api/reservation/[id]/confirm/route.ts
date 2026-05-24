import { prisma } from "@/lib/prisma";
import { expireReservationIfNeeded } from "@/lib/release-reservation";
import { ReservationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reservation =
    (await expireReservationIfNeeded(id)) ??
    (await prisma.reservation.findUnique({
      where: { id },
    }));

  if (!reservation) {
    return NextResponse.json(
      {
        error: "Reservation not found"
      },
      {
        status: 404
      }
    );
  }

  if (reservation.status === ReservationStatus.RELEASED) {
    return NextResponse.json(
      {
        error: "Reservation expired"
      },
      {
        status: 410
      }
    );
  }

  // Already confirmed
  if (
    reservation.status ===
    ReservationStatus.CONFIRMED
  ) {
    return NextResponse.json(
      {
        error: "Reservation already confirmed"
      },
      {
        status: 400
      }
    );
  }

  const updated =
    await prisma.reservation.update({
      where: {
        id
      },
      data: {
        status:
          ReservationStatus.CONFIRMED
      }
    });

  return NextResponse.json(updated);
}