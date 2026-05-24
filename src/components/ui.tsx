import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function AppHeader({
  showProductsLink = true,
}: {
  showProductsLink?: boolean;
}) {
  return (
    <header className="border-b border-cyan-400/20 bg-[#004d7a] shadow-lg shadow-black/20">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#004d7a] shadow-md">
            A
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">
              Allo Inventory
            </p>
            <p className="text-xs text-cyan-100/80">
              Reserve · Confirm · Ship
            </p>
          </div>
        </Link>
        {showProductsLink && (
          <nav>
            <Link
              href="/"
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Products
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function PageShell({
  children,
  title,
  subtitle,
  showProductsLink = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showProductsLink?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#003153]">
      <AppHeader showProductsLink={showProductsLink} />
      <div className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 max-w-2xl text-cyan-100/75">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/95 p-5 shadow-xl shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

type AlertVariant = "error" | "success" | "warning" | "info";

const alertStyles: Record<AlertVariant, string> = {
  error:
    "border-red-200 bg-red-50 text-red-900",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-cyan-200 bg-cyan-50 text-cyan-900",
};

export function Alert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: AlertVariant;
}) {
  return (
    <div
      role="alert"
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${alertStyles[variant]}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "success" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-400 focus-visible:outline-cyan-300",
    success:
      "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-green-500 focus-visible:outline-emerald-300",
    secondary:
      "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-400",
    ghost:
      "text-cyan-100 hover:bg-white/10 focus-visible:outline-cyan-300",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LoadingState({
  label = "Loading...",
  showProductsLink = true,
}: {
  label?: string;
  showProductsLink?: boolean;
}) {
  return (
    <PageShell showProductsLink={showProductsLink}>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
        <p className="mt-4 text-cyan-100/80">{label}</p>
      </div>
    </PageShell>
  );
}

export function StockPill({
  label,
  value,
  highlight,
  outOfStock,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  outOfStock?: boolean;
}) {
  return (
    <span
      className={`inline-flex flex-col rounded-lg px-3 py-1.5 text-center ${
        outOfStock
          ? "bg-red-100 text-red-800"
          : highlight
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </span>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300 transition hover:text-white"
    >
      ← {children}
    </Link>
  );
}
