import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

/**
 * Reusable button component with simple visual variants.
 */
export function Button({
  children,
  className = "",
  variant = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === "primary"
      ? "button button--primary"
      : variant === "ghost"
        ? "button button--ghost"
        : "button";

  return (
    <button
      type={type}
      className={`${variantClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}