import type { ReactNode } from "react";

/**
 * A small reusable responsive shell for top-level pages.
 * Keeps layout logic out of page files and gives us a clean,
 * mobile-friendly default container.
 */
type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "#121826",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          padding: "clamp(20px, 4vw, 32px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          style={{
            marginTop: "0.75rem",
            marginBottom: "0.75rem",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "1.5rem",
            fontSize: "clamp(1rem, 2.2vw, 1.05rem)",
            color: "#cbd5e1",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>

        {children}
      </section>
    </main>
  );
}