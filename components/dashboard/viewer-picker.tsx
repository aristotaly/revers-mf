"use client";

import { useTransition } from "react";
import Link from "next/link";
import { User as UserIcon, LogOut } from "lucide-react";
import type { CurrentUser } from "@/lib/session";
import type { ViewerTarget } from "@/lib/viewer";
import { selectViewingTargetAction } from "@/lib/actions/viewer";

type ViewerPickerProps = {
  session: CurrentUser;
  targets: ViewerTarget[];
};

/**
 * Landing screen for a viewer who has not yet chosen which user to look at.
 * Shows one icon per assigned target user. Single-target viewers never see
 * this — the dashboard auto-selects their only target.
 */
export function ViewerPicker({ session, targets }: ViewerPickerProps) {
  const [pending, startTransition] = useTransition();

  function pick(id: string) {
    startTransition(async () => {
      await selectViewingTargetAction(id, "/dashboard");
    });
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-neutral-100 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Choose a user
            </h1>
            <p className="text-sm text-neutral-500">
              Signed in as {session.name} · viewer
            </p>
          </div>
          <Link
            href="/logout"
            prefetch={false}
            className="flex items-center gap-1 text-sm text-neutral-600 underline"
            data-testid="logout-link"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Link>
        </div>
      </header>

      <div className="px-4 py-6">
        {targets.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-neutral-700">
              No users have been assigned to your account yet. Ask the admin
              to grant you access.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3"
            data-testid="viewer-target-grid"
          >
            {targets.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => pick(t.id)}
                disabled={pending}
                data-testid={`viewer-target-${t.username}`}
                className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md active:scale-95 disabled:opacity-60"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <UserIcon className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    @{t.username}
                  </p>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
