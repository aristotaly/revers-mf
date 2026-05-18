import Link from "next/link";
import { ChevronLeft, GraduationCap, Plus } from "lucide-react";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  rightAction?: React.ReactNode;
  showTutorialIcon?: boolean;
  onTutorialClick?: () => void;
};

export function AppHeader({
  title,
  backHref = "/weight-trend",
  rightAction,
  showTutorialIcon = false,
  onTutorialClick,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
      <Link
        href={backHref}
        className="flex h-9 w-9 items-center justify-center text-neutral-900"
        aria-label="Go back"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </Link>
      <h1 className="text-base font-semibold text-neutral-900">{title}</h1>
      <div className="flex h-9 w-9 items-center justify-center">
        {rightAction ??
          (showTutorialIcon ? (
            <button
              type="button"
              onClick={onTutorialClick}
              className="flex h-9 w-9 items-center justify-center text-neutral-900"
              aria-label="Show tutorial"
            >
              <GraduationCap className="h-5 w-5" strokeWidth={1.5} />
            </button>
          ) : (
            <span className="h-9 w-9" />
          ))}
      </div>
    </header>
  );
}

export function HeaderAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center text-neutral-900"
      aria-label="Add entry"
    >
      <Plus className="h-5 w-5" strokeWidth={1.5} />
    </button>
  );
}
