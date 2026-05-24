"use client";

import { getApiErrorMessage } from "@/lib/api-errors";
import Link from "next/link";
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
        setTimeLeft("Expired");
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
    return <div className="p-8">Loading...</div>;
  }

  if (!reservation) {
    return (
      <main className="p-8 max-w-lg mx-auto">
        <p className="text-red-600 dark:text-red-400">
          {error ?? "Reservation not found."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 underline"
        >
          Back to products
        </Link>
      </main>
    );
  }

  const actionsDisabled =
    !isPending ||
    actionLoading !== null ||
    TERMINAL_STATUSES.has(reservation.status);

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Reservation</h1>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <dl className="space-y-2 mb-6">
        <div>
          <dt className="text-sm text-neutral-500">Reservation ID</dt>
          <dd className="font-mono">{reservation.id}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Quantity</dt>
          <dd>{reservation.quantity}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Status</dt>
          <dd className="font-semibold">{reservation.status}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500">Expires in</dt>
          <dd className="text-xl tabular-nums">
            {reservation.status === "PENDING" ? timeLeft : "—"}
          </dd>
        </div>
      </dl>

      {reservation.status === "CONFIRMED" && (
        <p className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Purchase confirmed. Thank you!
        </p>
      )}

      {reservation.status === "RELEASED" && (
        <p className="mb-4 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          Reservation cancelled. Stock has been released.
        </p>
      )}

      {expired && reservation.status === "PENDING" && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This reservation has expired. Confirm purchase is no longer
          available.
        </p>
      )}

      {isPending && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={confirmPurchase}
            disabled={actionsDisabled}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "confirm"
              ? "Confirming..."
              : "Confirm purchase"}
          </button>

          <button
            type="button"
            onClick={cancelReservation}
            disabled={actionsDisabled}
            className="border border-neutral-300 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-600"
          >
            {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 inline-block text-blue-600 underline"
      >
        Back to products
      </Link>
    </main>
  );
}
