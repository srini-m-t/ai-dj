import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Reusable text input with shared styling.
 */
export function TextInput({ className = "", ...props }: TextInputProps) {
  return <input className={`input ${className}`.trim()} {...props} />;
}