"use client";

import {
  Alert,
  Button,
  Card,
  LoadingState,
  PageShell,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

interface Reservation {
  id: string;
  inventoryId: string;
  quantity: number;
  status: string;
  expiresAt: string;
}

const TERMINAL_STATUSES = new Set(["CONFIRMED", "RELEASED"]);

function statusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800";
    case "RELEASED":
      return "bg-slate-200 text-slate-700";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "confirm" | "cancel" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const loadReservation = useCallback(async () => {
    const response = await fetch(`/api/reservation/${id}`);

    if (!response.ok) {
      setError(await getApiErrorMessage(response));
      setReservation(null);
      setLoading(false);
      return;
    }

    const data = await response.json();
    setReservation(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  useEffect(() => {
    if (!reservation) return;

    const updateTimer = () => {
      const diff =
        new Date(reservation.expiresAt).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("0:00");
        setExpired(true);
        return;
      }

      setExpired(false);
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${minutes}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [reservation]);

  useEffect(() => {
    if (!expired || reservation?.status !== "PENDING") return;

    const sync = setTimeout(() => {
      loadReservation();
    }, 500);

    return () => clearTimeout(sync);
  }, [expired, reservation?.status, loadReservation]);

  const isPending =
    reservation?.status === "PENDING" && !expired;

  async function confirmPurchase() {
    setActionLoading("confirm");
    setError(null);

    try {
      const response = await fetch(
        `/api/reservation/${id}/confirm`,
        { method: "POST" }
      );

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        if (response.status === 410) {
          setExpired(true);
          await loadReservation();
        }
        return;
      }

      const data = await response.json();
      setReservation(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelReservation() {
    setActionLoading("cancel");
    setError(null);

    try {
      const response = await fetch(
        `/api/reservation/${id}/release`,
        { method: "POST" }
      );

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return;
      }

      const data = await response.json();
      setReservation(data);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <LoadingState
        label="Loading reservation..."
        showProductsLink={false}
      />
    );
  }

  if (!reservation) {
    return (
      <PageShell title="Reservation" showProductsLink>
        <Card className="max-w-lg">
          <Alert>{error ?? "Reservation not found."}</Alert>
        </Card>
      </PageShell>
    );
  }

  const showProductsLink = TERMINAL_STATUSES.has(
    reservation.status
  );

  const actionsDisabled =
    !isPending ||
    actionLoading !== null ||
    TERMINAL_STATUSES.has(reservation.status);

  const releasedByExpiry =
    reservation.status === "RELEASED" &&
    new Date(reservation.expiresAt).getTime() < Date.now();

  return (
    <PageShell
      title="Checkout"
      subtitle="Confirm your purchase before the timer runs out."
      showProductsLink={showProductsLink}
    >
      <div className="mx-auto max-w-lg">
        {error && <Alert>{error}</Alert>}

        <Card>
          <div className="mb-6 flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColor(reservation.status)}`}
            >
              {reservation.status}
            </span>
            {reservation.status === "PENDING" && (
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Expires in
                </p>
                <p
                  className={`font-mono text-3xl font-bold tabular-nums ${
                    expired || timeLeft === "0:00"
                      ? "text-red-600"
                      : "text-[#003153]"
                  }`}
                >
                  {timeLeft}
                </p>
              </div>
            )}
          </div>

          <dl className="space-y-4 border-t border-slate-100 pt-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Reservation ID
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-800">
                {reservation.id}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Quantity
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">
                  {reservation.quantity}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Inventory
                </dt>
                <dd className="mt-1 truncate font-mono text-xs text-slate-600">
                  {reservation.inventoryId}
                </dd>
              </div>
            </div>
          </dl>

          {reservation.status === "CONFIRMED" && (
            <Alert variant="success">
              Purchase confirmed. Thank you!
            </Alert>
          )}

          {reservation.status === "RELEASED" && !releasedByExpiry && (
            <Alert variant="info">
              Reservation cancelled. Stock has been returned to
              inventory.
            </Alert>
          )}

          {releasedByExpiry && (
            <Alert variant="warning">
              This reservation expired and stock was released
              automatically.
            </Alert>
          )}

          {isPending && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="success"
                onClick={confirmPurchase}
                disabled={actionsDisabled}
                className="flex-1"
              >
                {actionLoading === "confirm"
                  ? "Confirming..."
                  : "Confirm purchase"}
              </Button>

              <Button
                variant="secondary"
                onClick={cancelReservation}
                disabled={actionsDisabled}
                className="flex-1"
              >
                {actionLoading === "cancel"
                  ? "Cancelling..."
                  : "Cancel"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
