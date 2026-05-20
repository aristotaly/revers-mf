import Link from "next/link";
import { ChevronRight } from "lucide-react";

type DashboardCardProps = {
  title: string;
  subtitle: string;
  href: string;
  footerLeft: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardCard({
  title,
  subtitle,
  href,
  footerLeft,
  children,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex min-h-[168px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-800">{footerLeft}</div>
        <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
      </div>
    </Link>
  );
}
