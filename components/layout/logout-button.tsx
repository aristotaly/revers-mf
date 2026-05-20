import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  username?: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
};

export function LogoutButton({
  username,
  variant = "outline",
  className,
}: LogoutButtonProps) {
  const label = username ? `Sign out (${username})` : "Sign out";

  return (
    <Button variant={variant} size="sm" className={className} asChild>
      <Link
        href="/logout"
        prefetch={false}
        data-testid="logout-link"
        aria-label={label}
      >
        <LogOut className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
