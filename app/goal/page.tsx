import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { GoalForm } from "@/components/goal/goal-form";
import { getCurrentUser } from "@/lib/session";
import { getUserGoal } from "@/lib/actions/goals";
import { buildDashboardData } from "@/lib/dashboard/build-dashboard-data";

export const dynamic = "force-dynamic";

export default async function GoalPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role === "viewer") redirect("/dashboard");

  const [goal, dashboard] = await Promise.all([
    getUserGoal(),
    buildDashboardData(me.id),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <AppHeader title="Goal Progress" backHref="/dashboard" />
      <div className="space-y-4 px-4 py-6">
        <p className="text-sm text-neutral-600">
          Set a target weight for your goal progress widget. Progress is
          calculated from your EWMA trend line toward the target.
        </p>
        {dashboard.goal && (
          <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
            Current progress:{" "}
            <strong>{dashboard.goal.progressPercent}%</strong> toward{" "}
            {dashboard.goal.targetWeight} kg
          </div>
        )}
        <GoalForm
          goal={goal}
          suggestedStartWeight={dashboard.latestTrend}
        />
      </div>
    </div>
  );
}
