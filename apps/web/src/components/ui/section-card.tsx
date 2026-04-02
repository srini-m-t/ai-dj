import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Generic content card used across pages.
 */
export function SectionCard({
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      {title ? <h2 className="section-title">{title}</h2> : null}

      {description ? <p className="section-description">{description}</p> : null}

      {children}
    </section>
  );
}
