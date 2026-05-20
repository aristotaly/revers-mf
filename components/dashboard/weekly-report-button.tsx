"use client";

import { useRef, useState, useTransition } from "react";
import { FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WeekReportEntry } from "@/lib/dashboard/week-report";

type WeeklyReportButtonProps = {
  weekLabel: string;
  days: WeekReportEntry[];
  userName?: string;
};

export function WeeklyReportButton({
  weekLabel,
  days,
  userName,
}: WeeklyReportButtonProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();

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
    const node = reportRef.current;
    if (!node) return;

    startTransition(async () => {
      try {
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.download = `scale-weight-week-${days[0]?.date ?? "report"}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Weekly report downloaded");
      } catch {
        toast.error("Could not generate image. Try again.");
      }
    });
  }

  const chartW = 280;
  const chartH = 100;
  const points = logged
    .map((d, i) => {
      const x =
        logged.length <= 1
          ? chartW / 2
          : (i / (logged.length - 1)) * chartW;
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
        disabled={pending || logged.length === 0}
        onClick={handleDownload}
        data-testid="weekly-report-button"
      >
        <FileDown className="h-4 w-4" />
        {pending ? "Generating…" : "Download weekly report (image)"}
      </Button>
      {logged.length === 0 && (
        <p className="mt-1 text-center text-xs text-neutral-500">
          Log at least one weight this week to generate a report.
        </p>
      )}

      {/* Off-screen card captured as PNG */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div
          ref={reportRef}
          className="w-[320px] rounded-2xl bg-white p-5 shadow-lg"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
            Weight Trend Tracker
          </p>
          <h2 className="mt-1 text-lg font-bold text-neutral-900">
            Weekly Scale Report
          </h2>
          {userName && (
            <p className="text-sm text-neutral-600">{userName}</p>
          )}
          <p className="mt-1 text-sm text-neutral-500">{weekLabel}</p>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {days.map((d) => (
              <div key={d.date} className="text-[10px] font-medium text-neutral-500">
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
                {logged.map((d, i) => {
                  const x =
                    logged.length <= 1
                      ? chartW / 2
                      : (i / (logged.length - 1)) * chartW;
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
