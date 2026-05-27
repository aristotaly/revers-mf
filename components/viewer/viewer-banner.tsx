"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { ViewerTarget } from "@/lib/viewer";
import { ViewerSwitcher } from "@/components/dashboard/viewer-switcher";

type ViewerBannerProps = {
  viewing: ViewerTarget;
  otherTargets: ViewerTarget[];
  /** Path that the switcher redirects to (defaults to /dashboard). */
  redirectTo?: string;
};

/**
 * Slim "you are in viewer mode" banner that sits below the AppHeader on every
 * read screen. Lets the user see whose data they're looking at, jump back to
 * the home dashboard, and (when they have more than one target) hop to a
 * different user.
 */
export function ViewerBanner({
  viewing,
  otherTargets,
  redirectTo = "/dashboard",
}: ViewerBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2"
      data-testid="viewer-banner"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm text-amber-900">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">
          Viewing{" "}
          <strong data-testid="viewer-active-user-name">{viewing.name}</strong>{" "}
          · read-only
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          prefetch={false}
          className="text-xs font-medium text-amber-900 underline"
          data-testid="viewer-home-link"
        >
          Home
        </Link>
        <ViewerSwitcher
          otherTargets={otherTargets}
          currentRedirect={redirectTo}
        />
      </div>
    </div>
  );
}
