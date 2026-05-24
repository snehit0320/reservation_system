import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateProduct(name: string) {
  const existing = await prisma.product.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.product.create({ data: { name } });
}

async function getOrCreateWarehouse(name: string) {
  const existing = await prisma.warehouse.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.warehouse.create({ data: { name } });
}

async function ensureInventory(
  productId: string,
  warehouseId: string,
  totalStock: number
) {
  const existing = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
  });

  if (existing) return existing;

  return prisma.inventory.create({
    data: {
      productId,
      warehouseId,
      totalStock,
      reservedStock: 0,
    },
  });
}

async function main() {
  const chennai = await getOrCreateWarehouse("Chennai Warehouse");
  const bangalore = await getOrCreateWarehouse("Bangalore Warehouse");
  const mumbai = await getOrCreateWarehouse("Mumbai Warehouse");

  const catalog: {
    name: string;
    stock: { warehouseId: string; totalStock: number }[];
  }[] = [
    {
      name: "iPhone 16",
      stock: [
        { warehouseId: chennai.id, totalStock: 10 },
        { warehouseId: bangalore.id, totalStock: 5 },
        { warehouseId: mumbai.id, totalStock: 8 },
      ],
    },
    {
      name: "AirPods Pro",
      stock: [
        { warehouseId: chennai.id, totalStock: 20 },
        { warehouseId: bangalore.id, totalStock: 15 },
      ],
    },
    {
      name: "MacBook Air M3",
      stock: [
        { warehouseId: chennai.id, totalStock: 6 },
        { warehouseId: bangalore.id, totalStock: 4 },
        { warehouseId: mumbai.id, totalStock: 3 },
      ],
    },
    {
      name: "iPad Pro 13",
      stock: [
        { warehouseId: chennai.id, totalStock: 12 },
        { warehouseId: mumbai.id, totalStock: 7 },
      ],
    },
    {
      name: "Apple Watch Series 10",
      stock: [
        { warehouseId: bangalore.id, totalStock: 18 },
        { warehouseId: mumbai.id, totalStock: 14 },
      ],
    },
    {
      name: "Samsung Galaxy S24",
      stock: [
        { warehouseId: chennai.id, totalStock: 9 },
        { warehouseId: bangalore.id, totalStock: 11 },
      ],
    },
    {
      name: "Sony WH-1000XM5",
      stock: [
        { warehouseId: chennai.id, totalStock: 25 },
        { warehouseId: bangalore.id, totalStock: 22 },
        { warehouseId: mumbai.id, totalStock: 16 },
      ],
    },
    {
      name: "Dell XPS 15",
      stock: [
        { warehouseId: bangalore.id, totalStock: 5 },
        { warehouseId: mumbai.id, totalStock: 4 },
      ],
    },
    {
      name: "Logitech MX Master 3S",
      stock: [
        { warehouseId: chennai.id, totalStock: 30 },
        { warehouseId: bangalore.id, totalStock: 28 },
      ],
    },
    {
      name: "Kindle Paperwhite",
      stock: [
        { warehouseId: chennai.id, totalStock: 0 },
        { warehouseId: bangalore.id, totalStock: 12 },
        { warehouseId: mumbai.id, totalStock: 0 },
      ],
    },
    {
      name: "Nintendo Switch OLED",
      stock: [
        { warehouseId: chennai.id, totalStock: 8 },
        { warehouseId: mumbai.id, totalStock: 6 },
      ],
    },
    {
      name: "PlayStation 5",
      stock: [
        { warehouseId: bangalore.id, totalStock: 2 },
        { warehouseId: mumbai.id, totalStock: 1 },
      ],
    },
  ];

  for (const item of catalog) {
    const product = await getOrCreateProduct(item.name);

    for (const row of item.stock) {
      await ensureInventory(
        product.id,
        row.warehouseId,
        row.totalStock
      );
    }
  }

  const productCount = await prisma.product.count();
  const inventoryCount = await prisma.inventory.count();

  console.log(
    `Seed completed — ${productCount} products, ${inventoryCount} warehouse listings`
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
