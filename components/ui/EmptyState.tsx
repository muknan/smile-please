import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-card border border-neem-100 bg-chalk-0 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neem-100 font-utility text-xl text-neem-600" aria-hidden="true">—</div>
      <h2 className="mt-5 text-display-m">{title}</h2>
      <p className="mx-auto mt-3 max-w-[48ch] text-body text-ink-950/70">{description}</p>
      {action && <Button href={action.href} className="mt-6">{action.label}</Button>}
    </div>
  );
}
