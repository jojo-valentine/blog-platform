import React from "react";
import Image from "next/image";
type FeaturedProps = {
  title: string;
  description: string;
  author: string;
  date: string;
  imageUrl: string;
};

export default function Featured({
  title,
  description,
  author,
  date,
  imageUrl,
}: FeaturedProps) {
  return (
    <section className="featured">
      <Image
        src={imageUrl}
        alt="Featured article image"
        width={800}
        height={400}
      />

      <div className="featured-info">
        <span className="badge">FEATURED</span>
        <h2>{title}</h2>
        <p>{description}</p>

        <div className="author">
          <span>👤 {author}</span>
          <span>📅 {date}</span>
        </div>
      </div>
    </section>
  );
}
