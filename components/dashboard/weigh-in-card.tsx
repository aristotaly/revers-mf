"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { WeighInDay } from "@/lib/dashboard/build-dashboard-data";
import { EntryFormDialog } from "@/components/scale-weight/entry-form-dialog";

type WeighInCardProps = {
  days: WeighInDay[];
  weekLogged: number;
};

export function WeighInCard({ days, weekLogged }: WeighInCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<{
    date: string;
    weight?: number;
  } | null>(null);

  function openDay(day: WeighInDay) {
    setSelected({ date: day.date, weight: day.weight });
    setDialogOpen(true);
  }

  return (
    <>
      <div
        className="flex min-h-[168px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
        data-testid="weigh-in-card"
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-neutral-900">Weigh-In</h3>
          <p className="text-xs text-neutral-500">Last 30 Days</p>
        </div>
        <div
          className="grid flex-1 grid-cols-10 gap-1"
          role="group"
          aria-label="Last 30 days weigh-in calendar"
        >
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openDay(day);
              }}
              className={
                "aspect-square min-h-[14px] rounded-sm transition-colors " +
                (day.hasEntry
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-neutral-100 hover:bg-neutral-200")
              }
              title={
                day.hasEntry
                  ? `${day.date}: ${day.weight} kg`
                  : `${day.date}: log weight`
              }
              data-testid={`weigh-in-day-${day.date}`}
              aria-label={
                day.hasEntry
                  ? `Edit ${day.weight} kg on ${day.date}`
                  : `Log weight for ${day.date}`
              }
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-800">
            {weekLogged}/7 this week
          </span>
        </div>
      </div>

      {selected && (
        <EntryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={{
            date: selected.date,
            weight: selected.weight,
          }}
        />
      )}
    </>
  );
}
