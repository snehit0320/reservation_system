import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id
      }
    });

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

  if (
    reservation.status ===
    ReservationStatus.RELEASED
  ) {
    return NextResponse.json(
      {
        error: "Reservation already released"
      },
      {
        status: 400
      }
    );
  }

  const result =
    await prisma.$transaction(
      async (tx) => {

        await tx.inventory.update({
          where: {
            id: reservation.inventoryId
          },
          data: {
            reservedStock: {
              decrement:
                reservation.quantity
            }
          }
        });

        return tx.reservation.update({
          where: {
            id
          },
          data: {
            status:
              ReservationStatus.RELEASED
          }
        });

      }
    );

  return NextResponse.json(result);
}