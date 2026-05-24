"use client";

import {
  Alert,
  Button,
  Card,
  LoadingState,
  PageShell,
  StockPill,
} from "@/components/ui";
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
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        setProducts([]);
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        setError("Could not load products. Check server logs.");
        setProducts([]);
        return;
      }
      setProducts(data);
      setError(null);
    } catch {
      setError(
        "Could not reach the server. If this is production, check DATABASE_URL on Vercel (use Supabase pooler URL, password @ as %40)."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
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
    return <LoadingState label="Loading inventory..." />;
  }

  return (
    <PageShell
      title="Products"
      subtitle="Browse stock across warehouses and reserve units for checkout. Reservations expire after 10 minutes."
    >
      {error && <Alert>{error}</Alert>}

      {productGroups.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500">
            No products in inventory yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {productGroups.map((group) => (
            <Card key={group.product}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                    Product
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {group.product}
                  </h2>
                </div>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
                  {group.warehouses.length}{" "}
                  {group.warehouses.length === 1
                    ? "warehouse"
                    : "warehouses"}
                </span>
              </div>

              <ul className="space-y-4">
                {group.warehouses.map((item) => (
                  <li
                    key={item.inventoryId}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {item.warehouse}
                      </p>
                      {item.availableStock === 0 && (
                        <p className="mt-1 text-sm font-medium text-red-600">
                          Out of stock
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StockPill
                          label="Available"
                          value={item.availableStock}
                          highlight={item.availableStock > 0}
                          outOfStock={item.availableStock === 0}
                        />
                        <StockPill
                          label="Reserved"
                          value={item.reservedStock}
                        />
                        <StockPill
                          label="Total"
                          value={item.totalStock}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        reserveProduct(item.inventoryId)
                      }
                      disabled={
                        item.availableStock < 1 ||
                        reservingId === item.inventoryId
                      }
                      className="w-full sm:w-auto shrink-0"
                    >
                      {reservingId === item.inventoryId
                        ? "Reserving..."
                        : "Reserve"}
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
