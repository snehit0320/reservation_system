import { expireReservationIfNeeded } from "@/lib/release-reservation";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

  return NextResponse.json(reservation);
}