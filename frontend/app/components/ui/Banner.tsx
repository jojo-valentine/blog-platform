import React from "react";
type BannerProps = {
  title: string;
  subtitle: string;
  backgroundUrl?: string;
};

export default function Banner({
  title,
  subtitle,
  backgroundUrl,
}: BannerProps) {
  return (
    // HERO
    <section
      className="hero"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), 
                          url(${backgroundUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"})`,
      }}
      
    >
      <div className="hero-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}
