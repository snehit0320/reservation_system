import { prisma } from "@/lib/prisma";
import { ReservationStatus, type Reservation } from "@prisma/client";

export async function releaseReservationById(
  id: string
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    return null;
  }

  if (reservation.status === ReservationStatus.RELEASED) {
    return reservation;
  }

  if (reservation.status === ReservationStatus.CONFIRMED) {
    throw new Error("Cannot release confirmed reservation");
  }

  return prisma.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: reservation.inventoryId },
      data: {
        reservedStock: { decrement: reservation.quantity },
      },
    });

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.RELEASED },
    });
  });
}

export async function releaseExpiredReservations(): Promise<number> {
  const expired = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
  });

  for (const reservation of expired) {
    await releaseReservationById(reservation.id);
  }

  return expired.length;
}

export async function expireReservationIfNeeded(
  id: string
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    return null;
  }

  if (
    reservation.status === ReservationStatus.PENDING &&
    reservation.expiresAt < new Date()
  ) {
    return releaseReservationById(id);
  }

  return reservation;
}
