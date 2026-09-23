function SkeletonLine({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded bg-neem-100/75 ${className}`} />;
}

export default function LearnLoading() {
  return (
    <section aria-label="Loading Learn" aria-busy="true" className="public-hero public-section">
      <div className="container-content motion-safe:animate-[content-fade-in_var(--motion-standard)_var(--motion-ease-out)_both]">
        <span className="sr-only" role="status">Loading articles…</span>
        <SkeletonLine className="h-4 w-16" />
        <SkeletonLine className="mt-6 h-11 w-full max-w-2xl sm:h-14" />
        <div className="mt-6 max-w-[65ch] space-y-3">
          <SkeletonLine className="h-5 w-full" />
          <SkeletonLine className="h-5 w-4/5" />
        </div>
        <div className="mt-10 flex gap-6" aria-hidden="true">
          {["w-9", "w-16", "w-20", "w-14", "w-12"].map((width) => (
            <SkeletonLine key={width} className={`h-8 ${width}`} />
          ))}
        </div>
        <div className="mt-8 border-b border-neem-100 py-8 md:grid md:grid-cols-5 md:gap-10 md:border-t">
          <SkeletonLine className="aspect-[16/9] w-full md:col-span-2 md:aspect-auto md:min-h-48" />
          <div className="mt-6 space-y-4 md:col-span-3 md:mt-0">
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-8 w-full" />
            <SkeletonLine className="h-8 w-3/4" />
            <SkeletonLine className="h-5 w-full" />
            <SkeletonLine className="h-5 w-2/3" />
          </div>
        </div>
        <div className="grid gap-x-8 md:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-3 border-b border-neem-100 py-6">
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="h-6 w-full" />
              <SkeletonLine className="h-5 w-4/5" />
              <SkeletonLine className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
