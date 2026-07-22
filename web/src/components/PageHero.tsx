type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
};

export function PageHero({ eyebrow, title, subtitle, dark }: PageHeroProps) {
  return (
    <section className={`page-hero${dark ? ' page-hero--dark' : ''}`}>
      {eyebrow ? <p className="page-hero-eyebrow">{eyebrow}</p> : null}
      <h1 className="page-hero-title">{title}</h1>
      {subtitle ? <p className="page-hero-subtitle">{subtitle}</p> : null}
    </section>
  );
}
