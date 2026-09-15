"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <button aria-label={`Copiar ${label}`} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-400" onClick={copy} type="button">{copied ? <Check className="text-emerald-300" size={15} /> : <Copy size={15} />}</button>;
}
