import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/release-reservation";
import { ReservationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  reservationSchema
} from "@/lib/validator/reservation";
export async function POST(
  request: NextRequest
) {
  await releaseExpiredReservations();

  const body = await request.json();
  const parsed =
  reservationSchema.safeParse(
    body
  );

if (!parsed.success) {

  return NextResponse.json(
    {
      error:
        parsed.error.flatten()
    },
    {
      status: 400
    }
  );

}

  const {
  inventoryId,
  quantity
} = parsed.data;
  try {

  const reservation =
    await prisma.$transaction(
      async (tx) => {

        const inventory =
          await tx.inventory.findUnique({
            where: {
              id: inventoryId
            }
          });

        if (!inventory) {
          throw new Error(
            "Inventory not found"
          );
        }

        const updated =
          await tx.inventory.updateMany({
            where: {
              id: inventoryId,

              reservedStock: {
                lte:
                  inventory.totalStock -
                  quantity
              }
            },

            data: {
              reservedStock: {
                increment: quantity
              }
            }
          });

        if (updated.count === 0) {
          throw new Error(
            "Not enough stock"
          );
        }

        return tx.reservation.create({
          data: {
            inventoryId,
            quantity,

            status:
              ReservationStatus.PENDING,

            expiresAt:
              new Date(
                Date.now() +
                10 * 60 * 1000
              )
          }
        });

      }
    );

  return NextResponse.json(
    reservation
  );

} catch (error) {

  if (
    error instanceof Error &&
    error.message ===
      "Inventory not found"
  ) {

    return NextResponse.json(
      {
        error:
          "Inventory not found"
      },
      {
        status: 404
      }
    );

  }

  if (
    error instanceof Error &&
    error.message ===
      "Not enough stock"
  ) {

    return NextResponse.json(
      {
        error:
          "Not enough stock"
      },
      {
        status: 409
      }
    );

  }

  return NextResponse.json(
    {
      error:
        "Reservation failed"
    },
    {
      status: 500
    }
  );
}
}