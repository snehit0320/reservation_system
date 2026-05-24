import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 16"
    }
  });

  const airpods = await prisma.product.create({
    data: {
      name: "AirPods Pro"
    }
  });

  const chennai = await prisma.warehouse.create({
    data: {
      name: "Chennai Warehouse"
    }
  });

  const bangalore = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse"
    }
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: chennai.id,
        totalStock: 10,
        reservedStock: 0
      },
      {
        productId: iphone.id,
        warehouseId: bangalore.id,
        totalStock: 5,
        reservedStock: 0
      },
      {
        productId: airpods.id,
        warehouseId: chennai.id,
        totalStock: 20,
        reservedStock: 0
      }
    ]
  });

  console.log("Seed completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });