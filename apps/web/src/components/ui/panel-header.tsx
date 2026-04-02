import type { ReactNode } from "react";

type PanelHeaderProps = {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
};

/**
 * Shared header block for cards/panels with optional action content.
 */
export function PanelHeader({
  title,
  description,
  action,
}: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-header__content">
        <div className="panel-header__title">{title}</div>
        {description ? (
          <p className="panel-header__description">{description}</p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
