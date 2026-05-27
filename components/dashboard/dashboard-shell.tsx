"use client";

import Link from "next/link";
import type { DashboardPayload } from "@/lib/dashboard/build-dashboard-data";
import type { CurrentUser } from "@/lib/session";
import type { ViewerTarget } from "@/lib/viewer";
import { WeighInCard } from "./weigh-in-card";
import { WeightTrendMiniCard } from "./weight-trend-mini-card";
import { GoalProgressCard } from "./goal-progress-card";
import { ViewerSwitcher } from "./viewer-switcher";
import { WeeklyReportButton } from "./weekly-report-button";
import { InstallPrompt } from "@/components/install-prompt";
import { LogoutButton } from "@/components/layout/logout-button";

type DashboardShellProps = {
  data: DashboardPayload;
  currentUser?: CurrentUser;
  viewing?: ViewerTarget;
  isViewer?: boolean;
  otherTargets?: ViewerTarget[];
};

export function DashboardShell({
  data,
  currentUser,
  viewing,
  isViewer,
  otherTargets,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-100 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
            {isViewer && viewing ? (
              <p className="truncate text-sm text-neutral-500">
                Viewing{" "}
                <span
                  className="font-semibold text-neutral-700"
                  data-testid="viewer-active-user"
                >
                  {viewing.name}
                </span>{" "}
                · read-only
              </p>
            ) : (
              currentUser && (
                <p className="truncate text-sm text-neutral-500">
                  Hi, {currentUser.name}
                </p>
              )
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {isViewer && otherTargets && otherTargets.length > 0 && (
              <ViewerSwitcher
                otherTargets={otherTargets}
                currentRedirect="/dashboard"
              />
            )}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                prefetch={false}
                className="text-sm text-violet-700 underline"
                data-testid="admin-link"
              >
                Users
              </Link>
            )}
            <LogoutButton username={currentUser?.username} />
          </div>
        </div>
      </header>

      <InstallPrompt />

      <div className="space-y-6 px-4 py-4">
        <section>
          <h2 className="mb-3 text-base font-bold text-neutral-900">Habits</h2>
          <div className="grid grid-cols-2 gap-3">
            <WeighInCard
              days={data.weighInDays}
              weekLogged={data.weekLogged}
              readOnly={isViewer}
            />
            <WeightTrendMiniCard
              points={data.trendPoints7d}
              latestTrend={data.latestTrend}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-neutral-900">
            Insights &amp; Analytics
          </h2>
          <GoalProgressCard goal={data.goal} readOnly={isViewer} />
          <div className="mt-3">
            <WeeklyReportButton
              weighInDays={data.weighInDays}
              userName={viewing?.name ?? currentUser?.name}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
