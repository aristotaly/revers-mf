"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import type { DailyPoint } from "@/utils/analytics";
import { DashboardClient } from "./dashboard-client";
import { TutorialBanner } from "./tutorial-banner";

type WeightTrendShellProps = {
  allPoints: DailyPoint[];
  loggedEntries: { date: Date; weight: number }[];
  fixedDate?: Date;
};

export function WeightTrendShell({
  allPoints,
  loggedEntries,
  fixedDate,
}: WeightTrendShellProps) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader
        title="Weight Trend"
        backHref="/"
        showTutorialIcon
        onTutorialClick={() => setShowTutorial(true)}
      />
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
      <nav className="flex justify-center gap-4 px-4 pb-6 text-sm">
        <Link href="/scale-weight" className="text-violet-700 underline">
          Scale Weight
        </Link>
        <Link href="/weight-trend/logs" className="text-violet-700 underline">
          Trend Logs
        </Link>
      </nav>
    </div>
  );
}
