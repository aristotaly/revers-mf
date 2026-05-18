"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "weight-trend-tutorial-dismissed";

type TutorialBannerProps = {
  forceShow?: boolean;
  onDismiss?: () => void;
};

export function TutorialBanner({ forceShow = false, onDismiss }: TutorialBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    setVisible(localStorage.getItem(STORAGE_KEY) !== "true");
  }, [forceShow]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onDismiss?.();
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-violet-100 p-4">
      <div className="flex gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" />
        <div>
          <p className="font-semibold text-neutral-900">What is Weight Trend?</p>
          <p className="mt-1 text-sm text-neutral-700">
            Scale Weight data tends to be quite noisy. Your Weight Trend is the
            signal in all of that noise.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-neutral-700 underline-offset-2 hover:underline"
          onClick={dismiss}
        >
          Dismiss Tutorial
        </button>
        <Button
          size="sm"
          className="rounded-full bg-violet-300 text-neutral-900 hover:bg-violet-400"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
