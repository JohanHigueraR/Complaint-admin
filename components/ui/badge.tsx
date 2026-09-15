import type { HTMLAttributes } from "react";

type BadgeTone = "neutral" | "blue" | "amber" | "green" | "red";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${tones[tone]} ${className}`} {...props} />;
}
