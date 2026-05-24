import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/release-reservation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
  await releaseExpiredReservations();

  const inventories =
    await prisma.inventory.findMany({
      include: {
        product: true,
        warehouse: true
      }
    });

  const result = inventories.map((item) => ({
    inventoryId: item.id,

    product: item.product.name,

    warehouse: item.warehouse.name,

    totalStock: item.totalStock,

    reservedStock: item.reservedStock,

    availableStock:
      item.totalStock - item.reservedStock
  }));

  return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}