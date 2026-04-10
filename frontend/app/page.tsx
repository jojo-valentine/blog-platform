import Image from "next/image";
import Banner from "./components/ui/Banner";
import Featured from "./components/ui/Featured";

export default function Home() {
  return (
    <main className="container">
      {/* HERO */}
      <Banner
        title="BlogSpace"
        subtitle="Discover stories, ideas, and insights"
        backgroundUrl="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
      />

      {/* FEATURED */}
      <Featured
        title="Designing a Clean API"
        description="How to structure backend APIs for scalability and performance."
        author="jo"
        date="Apr 9, 2026"
        imageUrl="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
      />

      {/* POSTS */}
      <section className="posts">
        {[1, 2, 3].map((i) => (
          <div key={i} className="post-card">
            <Image
              src={`https://picsum.photos/400/200?${i}`}
              alt="post"
              width={400}
              height={200}
            />

            <div className="post-content">
              <h3>Post Title {i}</h3>
              <p>Short description of the blog post.</p>

              <div className="meta">
                <span className="tag">Tech</span>
                <span className="date">Apr {9 - i}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
