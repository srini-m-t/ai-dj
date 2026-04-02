import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Reusable textarea with shared styling.
 */
export function TextArea({ className = "", ...props }: TextAreaProps) {
  return <textarea className={`textarea ${className}`.trim()} {...props} />;
}