export const BOOKING_STEPS = [
  "Choose a dentist",
  "Pick a time",
  "Your details",
  "Confirmed",
] as const;

/**
 * The signature element (Phase 5 §5.8): a progress bar that is literally a
 * smile completing. Eight tooth-shaped nodes on an arc, two per step; nodes
 * fill with marigold-500 as the patient progresses.
 * The SVG is decorative (aria-hidden); the real state is a visually-hidden
 * ordered list, so a screen reader hears "Step 3 of 4: Your details".
 */
export function ArchStepper({ currentStep }: { currentStep: number }) {
  const step = Math.min(Math.max(currentStep, 0), BOOKING_STEPS.length - 1);

  const teeth = Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    const x = 30 + 260 * t;
    const y = 58 + 46 * Math.sin(Math.PI * t);
    const stepIndex = Math.floor(i / 2);
    const state =
      stepIndex < step ? "done" : stepIndex === step ? "current" : "upcoming";
    const fill =
      state === "done" ? "#E9A227" : state === "current" ? "#FFFFFF" : "#DCE7E0";
    const stroke =
      state === "done" ? "#E9A227" : state === "current" ? "#E9A227" : "#DCE7E0";
    return { x, y, fill, stroke, stepIndex, state };
  });

  return (
    <div role="group" aria-label="Booking progress">
      <svg
        viewBox="0 0 320 120"
        className="h-auto w-full max-w-[320px]"
        aria-hidden="true"
        focusable="false"
      >
        {/* smile guide line */}
        <path
          d="M30,80 C100,116 220,116 290,80"
          fill="none"
          stroke="#DCE7E0"
          strokeWidth="2"
        />
        {teeth.map((tooth, i) => (
          <g key={i} transform={`translate(${tooth.x - 8} ${tooth.y - 8})`}>
            <path
              d="M0,16 L0,7 C0,3.5 4,1.4 8,0.4 C12,1.4 16,3.5 16,7 L16,16 Z"
              fill={tooth.fill}
              stroke={tooth.stroke}
              strokeWidth="1.5"
              style={{ transition: "fill 250ms ease-out, stroke 250ms ease-out" }}
            />
          </g>
        ))}
      </svg>

      <ol className="sr-only">
        {BOOKING_STEPS.map((name, i) => (
          <li key={name}>
            Step {i + 1} of {BOOKING_STEPS.length}: {name}
            {i < step ? " — complete" : i === step ? " — current" : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
