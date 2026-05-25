"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WeighInDay } from "@/lib/dashboard/build-dashboard-data";
import {
  buildWeekReportEntries,
  getLast7DaysRangeLocal,
  weighInDaysToEntriesMap,
  type WeekReportEntry,
} from "@/lib/dashboard/week-report";

type WeeklyReportButtonProps = {
  weighInDays: WeighInDay[];
  userName?: string;
};

export function WeeklyReportButton({
  weighInDays,
  userName,
}: WeeklyReportButtonProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [capture, setCapture] = useState<{
    days: WeekReportEntry[];
    label: string;
  } | null>(null);

  const entriesMap = useMemo(
    () => weighInDaysToEntriesMap(weighInDays),
    [weighInDays],
  );

  const last7Preview = useMemo(
    () => buildWeekReportEntries(entriesMap),
    [entriesMap],
  );
  const loggedPreview = last7Preview.filter((d) => d.weight != null);

  const days = capture?.days ?? last7Preview;
  const weekLabel = capture?.label ?? getLast7DaysRangeLocal().label;
  const logged = days.filter((d) => d.weight != null);
  const weights = logged.map((d) => d.weight!);
  const minW = weights.length ? Math.min(...weights) : 0;
  const maxW = weights.length ? Math.max(...weights) : 100;
  const padding = 0.5;
  const chartMin = minW - padding;
  const chartMax = maxW + padding;

  function yForWeight(w: number, height: number): number {
    if (chartMax === chartMin) return height / 2;
    return height - ((w - chartMin) / (chartMax - chartMin)) * height;
  }

  function handleDownload() {
    const now = new Date();
    const reportDays = buildWeekReportEntries(entriesMap, now);
    const { label } = getLast7DaysRangeLocal(now);

    if (reportDays.every((d) => d.weight == null)) {
      toast.error("No scale weights logged in the last 7 days.");
      return;
    }

    startTransition(async () => {
      setCapture({ days: reportDays, label });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const node = reportRef.current;
      if (!node) {
        toast.error("Could not generate image. Try again.");
        setCapture(null);
        return;
      }

      try {
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.download = `scale-weight-7d-${reportDays[0]?.date ?? "report"}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Weekly report downloaded");
      } catch {
        toast.error("Could not generate image. Try again.");
      } finally {
        setCapture(null);
      }
    });
  }

  const chartW = 280;
  const chartH = 100;
  const points = logged
    .map((d, i) => {
      const dayIndex = days.findIndex((x) => x.date === d.date);
      const x =
        days.length <= 1
          ? chartW / 2
          : (dayIndex / (days.length - 1)) * chartW;
      const y = yForWeight(d.weight!, chartH);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending || loggedPreview.length === 0}
        onClick={handleDownload}
        data-testid="weekly-report-button"
      >
        <FileDown className="h-4 w-4" />
        {pending ? "Generating…" : "Download weekly report (image)"}
      </Button>
      {loggedPreview.length === 0 && (
        <p className="mt-1 text-center text-xs text-neutral-500">
          Log at least one weight in the last 7 days to generate a report.
        </p>
      )}

      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div
          ref={reportRef}
          className="w-[360px] rounded-2xl bg-white p-5 shadow-lg"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
            Weight Trend Tracker
          </p>
          <h2 className="mt-1 text-lg font-bold text-neutral-900">
            7-Day Scale Report
          </h2>
          {userName && (
            <p className="text-sm text-neutral-600">{userName}</p>
          )}
          <p className="mt-1 text-sm text-neutral-500">{weekLabel}</p>

          <div
            className="mt-4 grid gap-1 text-center"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((d) => (
              <div
                key={d.date}
                className="text-[9px] font-medium leading-tight text-neutral-500"
              >
                {d.dayLabel}
              </div>
            ))}
            {days.map((d) => (
              <div
                key={`${d.date}-w`}
                className={
                  "rounded-md py-2 text-xs font-semibold " +
                  (d.weight != null
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-100 text-neutral-400")
                }
              >
                {d.weight != null ? d.weight.toFixed(1) : "—"}
              </div>
            ))}
          </div>

          {logged.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-neutral-600">
                Scale weight (kg)
              </p>
              <svg
                width={chartW}
                height={chartH + 24}
                className="overflow-visible"
              >
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  points={points}
                />
                {logged.map((d) => {
                  const dayIndex = days.findIndex((x) => x.date === d.date);
                  const x =
                    days.length <= 1
                      ? chartW / 2
                      : (dayIndex / (days.length - 1)) * chartW;
                  const y = yForWeight(d.weight!, chartH);
                  return (
                    <circle
                      key={d.date}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8b5cf6"
                    />
                  );
                })}
              </svg>
            </div>
          )}

          <p className="mt-4 text-[10px] text-neutral-400">
            Generated {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </>
  );
}
