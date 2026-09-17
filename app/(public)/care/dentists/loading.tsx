function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded bg-neem-100/75 ${className}`} />;
}

export default function DentistsLoading() {
  return (
    <section aria-label="Loading dentists" aria-busy="true" className="public-hero public-section">
      <div className="container-content motion-safe:animate-[content-fade-in_var(--motion-standard)_var(--motion-ease-out)_both]">
        <span className="sr-only" role="status">Loading dentists and available times…</span>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-11 w-full max-w-xl sm:h-14" />
        <div className="mt-6 max-w-[65ch] space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        <Skeleton className="mt-6 h-11 w-36" />
        <div className="mt-12 flex flex-wrap gap-3">
          {["w-36", "w-36", "w-64", "w-24"].map((width, index) => (
            <Skeleton key={`${width}-${index}`} className={`h-11 ${width}`} />
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-44" />)}
        </div>
      </div>
    </section>
  );
}
