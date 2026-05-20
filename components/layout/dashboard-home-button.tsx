"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

const HIDDEN_ON = ["/dashboard", "/login"];

export function DashboardHomeButton() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      prefetch={false}
      className="fixed bottom-6 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg ring-2 ring-white transition-transform hover:scale-105 hover:bg-violet-700 active:scale-95"
      aria-label="Go to dashboard"
      data-testid="dashboard-home-button"
    >
      <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}
