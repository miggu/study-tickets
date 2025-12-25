type HeroHeaderProps = {
  title: string;
  description: string;
  badge: string;
};

export function HeroHeader({ title, description, badge }: HeroHeaderProps) {
  return (
    <header className="hero">
      <div className="hero__text">
        <p className="hero__eyebrow">Course capture</p>
        <h1>{title}</h1>
        <p className="hero__lede">{description}</p>
      </div>
      <div className="hero__badge">{badge}</div>
    </header>
  );
}
