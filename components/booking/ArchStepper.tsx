export const BOOKING_STEPS = [
  "Choose a dentist",
  "Pick a time",
  "Your details",
  "Confirmed",
] as const;

export function ArchStepper({ currentStep }: { currentStep: number }) {
  const step = Math.min(Math.max(currentStep, 0), BOOKING_STEPS.length - 1);

  return (
    <nav aria-label="Booking progress" className="mb-10">
      <p className="font-utility text-body-s font-semibold text-neem-700">
        Step {step + 1} of {BOOKING_STEPS.length}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
        {BOOKING_STEPS.map((name, i) => (
          <span key={name} className={`h-1.5 rounded-full ${i <= step ? "bg-marigold-500" : "bg-neem-100"}`} />
        ))}
      </div>
      <ol className="sr-only">
        {BOOKING_STEPS.map((name, i) => (
          <li key={name}>
            Step {i + 1} of {BOOKING_STEPS.length}: {name}
            {i < step ? " — complete" : i === step ? " — current" : ""}
          </li>
        ))}
      </ol>
    </nav>
  );
}
