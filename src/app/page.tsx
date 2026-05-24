"use client";

import { getApiErrorMessage } from "@/lib/api-errors";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Product {
  inventoryId: string;
  product: string;
  warehouse: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

interface ProductGroup {
  product: string;
  warehouses: Product[];
}

function groupByProduct(items: Product[]): ProductGroup[] {
  const map = new Map<string, Product[]>();

  for (const item of items) {
    const list = map.get(item.product) ?? [];
    list.push(item);
    map.set(item.product, list);
  }

  return Array.from(map.entries()).map(([product, warehouses]) => ({
    product,
    warehouses,
  }));
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productGroups = useMemo(
    () => groupByProduct(products),
    [products]
  );

  const fetchProducts = useCallback(async () => {
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function reserveProduct(inventoryId: string) {
    setReservingId(inventoryId);
    setError(null);

    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity: 1 }),
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        if (response.status === 409) {
          await fetchProducts();
        }
        return;
      }

      const data = await response.json();
      router.push(`/reservation/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setReservingId(null);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Inventory System</h1>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {productGroups.map((group) => (
          <div
            key={group.product}
            className="border rounded-lg p-4 shadow"
          >
            <h2 className="text-xl font-semibold mb-3">
              {group.product}
            </h2>

            <ul className="space-y-3">
              {group.warehouses.map((item) => (
                <li
                  key={item.inventoryId}
                  className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="font-medium">{item.warehouse}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Available: {item.availableStock}
                      <span className="mx-2">·</span>
                      Reserved: {item.reservedStock}
                      <span className="mx-2">·</span>
                      Total: {item.totalStock}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => reserveProduct(item.inventoryId)}
                    disabled={
                      item.availableStock < 1 ||
                      reservingId === item.inventoryId
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reservingId === item.inventoryId
                      ? "Reserving..."
                      : "Reserve"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
