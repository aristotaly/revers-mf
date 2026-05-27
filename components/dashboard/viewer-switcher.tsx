"use client";

import { useTransition } from "react";
import { Repeat } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewerTarget } from "@/lib/viewer";
import { selectViewingTargetAction } from "@/lib/actions/viewer";

type ViewerSwitcherProps = {
  otherTargets: ViewerTarget[];
  /** Page to land on after switching (defaults to /dashboard). */
  currentRedirect?: string;
};

/**
 * Tiny header dropdown that lets a multi-target viewer hop between the
 * dashboards of users they're allowed to see. Hidden by callers when the
 * viewer has only one target available.
 */
export function ViewerSwitcher({
  otherTargets,
  currentRedirect = "/dashboard",
}: ViewerSwitcherProps) {
  const [pending, startTransition] = useTransition();

  if (otherTargets.length === 0) return null;

  function pick(id: string) {
    startTransition(async () => {
      await selectViewingTargetAction(id, currentRedirect);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        disabled={pending}
        data-testid="viewer-switch-trigger"
        aria-label="Switch user"
      >
        <Repeat className="h-3.5 w-3.5" /> Switch
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherTargets.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => pick(t.id)}
            data-testid={`viewer-switch-option-${t.username}`}
            className="cursor-pointer"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-neutral-900">
                {t.name}
              </span>
              <span className="truncate text-xs text-neutral-500">
                @{t.username}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
