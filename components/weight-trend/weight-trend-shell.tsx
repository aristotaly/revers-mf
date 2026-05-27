"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { InstallPrompt } from "@/components/install-prompt";
import type { DailyPoint } from "@/utils/analytics";
import type { CurrentUser } from "@/lib/session";
import type { ViewerTarget } from "@/lib/viewer";
import { DashboardClient } from "./dashboard-client";
import { TutorialBanner } from "./tutorial-banner";
import { ViewerBanner } from "@/components/viewer/viewer-banner";

type WeightTrendShellProps = {
  allPoints: DailyPoint[];
  loggedEntries: { date: Date; weight: number }[];
  fixedDate?: Date;
  currentUser?: CurrentUser;
  viewing?: ViewerTarget;
  isViewer?: boolean;
  otherTargets?: ViewerTarget[];
};

export function WeightTrendShell({
  allPoints,
  loggedEntries,
  fixedDate,
  currentUser,
  viewing,
  isViewer,
  otherTargets,
}: WeightTrendShellProps) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <AppHeader
        title="Weight Trend"
        backHref="/dashboard"
        showTutorialIcon
        onTutorialClick={() => setShowTutorial(true)}
      />
      {isViewer && viewing && (
        <ViewerBanner viewing={viewing} otherTargets={otherTargets ?? []} />
      )}
      <InstallPrompt />
      <DashboardClient
        allPoints={allPoints}
        loggedEntries={loggedEntries}
        fixedDate={fixedDate}
      />
      {showTutorial && (
        <TutorialBanner
          forceShow
          onDismiss={() => setShowTutorial(false)}
        />
      )}
      <nav className="flex flex-wrap justify-center gap-4 px-4 pb-6 text-sm">
        {!isViewer && (
          <Link href="/scale-weight" className="text-violet-700 underline">
            Scale Weight
          </Link>
        )}
        <Link href="/weight-trend/logs" className="text-violet-700 underline">
          Trend Logs
        </Link>
        {currentUser?.role === "admin" && (
          <Link
            href="/admin"
            prefetch={false}
            className="text-violet-700 underline"
            data-testid="admin-link"
          >
            Manage users
          </Link>
        )}
        <Link
          href="/logout"
          prefetch={false}
          className="text-neutral-500 underline"
          data-testid="logout-link"
        >
          {currentUser ? `Sign out (${currentUser.username})` : "Sign out"}
        </Link>
      </nav>
    </div>
  );
}
