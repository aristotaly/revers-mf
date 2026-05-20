"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertUserGoal, deleteUserGoal } from "@/lib/actions/goals";
import type { UserGoal } from "@/lib/actions/goals";

type GoalFormProps = {
  goal: UserGoal | null;
  suggestedStartWeight: number | null;
};

export function GoalForm({ goal, suggestedStartWeight }: GoalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertUserGoal(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Goal saved");
    });
  }

  function handleDelete() {
    if (!confirm("Remove your weight goal?")) return;
    startTransition(async () => {
      await deleteUserGoal();
      toast.success("Goal removed");
    });
  }

  return (
    <form action={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="targetWeight">Target weight (kg)</Label>
        <Input
          id="targetWeight"
          name="targetWeight"
          type="number"
          step="0.1"
          min="0"
          required
          defaultValue={goal?.targetWeight}
          data-testid="target-weight-input"
        />
        <p className="text-xs text-neutral-500">
          The weight you are working toward.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="startWeight">Starting weight (kg)</Label>
        <Input
          id="startWeight"
          name="startWeight"
          type="number"
          step="0.1"
          min="0"
          placeholder="Auto: highest logged weight (loss) or lowest (gain)"
          defaultValue={goal?.startWeight}
          data-testid="start-weight-input"
        />
        <p className="text-xs text-neutral-500">
          Leave blank when creating a goal to use your historical high (weight
          loss) or low (weight gain)—not today&apos;s weight. When editing,
          blank keeps your saved starting weight.
          {suggestedStartWeight != null && (
            <> Current scale: {suggestedStartWeight.toFixed(1)} kg.</>
          )}
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600" data-testid="goal-error">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full"
        data-testid="save-goal"
      >
        {pending ? "Saving…" : "Save goal"}
      </Button>
      {goal && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="w-full"
          onClick={handleDelete}
          data-testid="delete-goal"
        >
          Remove goal
        </Button>
      )}
    </form>
  );
}
