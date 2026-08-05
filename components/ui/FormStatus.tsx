export function FormStatus({
  error,
  success,
  id,
}: {
  error?: string | null;
  success?: string | null;
  id?: string;
}) {
  const message = error ?? success;
  if (!message) return null;
  return (
    <p id={id} role={error ? "alert" : "status"} aria-live="polite" className={error ? "text-body-s text-clay-600" : "text-body-s text-neem-600"}>
      {message}
    </p>
  );
}
