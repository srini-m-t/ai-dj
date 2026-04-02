import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

/**
 * Reusable max-width layout wrapper.
 */
export function Container({ children }: ContainerProps) {
  return <div className="container">{children}</div>;
}