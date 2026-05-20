export function LegendCard() {
  return (
    <div
      className="flex items-center justify-center gap-8 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-100"
      data-testid="weigh-in-legend"
    >
      <LegendDot label="Tracked" tone="tracked" />
      <LegendDot label="Untracked" tone="untracked" />
    </div>
  );
}

function LegendDot({
  label,
  tone,
}: {
  label: string;
  tone: "tracked" | "untracked";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={
          "inline-block h-3 w-3 rounded-full " +
          (tone === "tracked"
            ? "ring-2 ring-emerald-500"
            : "ring-1 ring-neutral-300")
        }
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </div>
  );
}
