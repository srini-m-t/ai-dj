type HeroPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Reusable hero section for top-level pages.
 */
export function HeroPanel({ eyebrow, title, description }: HeroPanelProps) {
  return (
    <section className="hero-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="hero-title">{title}</h1>
      <p className="hero-description">{description}</p>
    </section>
  );
}