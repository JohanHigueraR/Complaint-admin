"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import styles from "./copy-button.module.scss";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return (
    <button aria-label={`Copiar ${label}`} className={styles.button} onClick={copy} type="button">
      {copied ? <Check className={styles.copied} size={15} /> : <Copy size={15} />}
    </button>
  );
}
