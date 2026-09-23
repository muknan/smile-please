import { ArrowRight } from "lucide-react";

/** Keep the final word and arrow together, while allowing the label to reflow. */
export function ArrowLabel({ children }: { children: string }) {
  const label = children.trim();
  const lastSpace = label.lastIndexOf(" ");
  return (
    <span>
      {lastSpace >= 0 && label.slice(0, lastSpace + 1)}
      <span className="inline-block whitespace-nowrap">
        {label.slice(lastSpace + 1)}
        <ArrowRight size={17} aria-hidden="true" className="ml-2 inline-block align-[-0.15em]" />
      </span>
    </span>
  );
}
