"use client";
import Banner from "./components/ui/banner";
import Featured from "./components/ui/featured";
import { PostSkeleton } from "./components/skeleton/post-skeleton";
import { BannerSkeleton } from "./components/skeleton/banner-skeleton";
import { FeaturedSkeleton } from "./components/skeleton/featured-skeleton";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { motion } from "framer-motion";
type Blog = {
  _id: string;
  title: string;
  content: string;
  cover_image: string[];
  tags_id: { _id: string; name: string }[];
  createdAt: string;
  user_id: {
    username?: string;
    profile?: {
      display_name: string;
    };
  };
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Blog[]>([]);
  const [featured, setFeatured] = useState<Blog | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/home`);
      const data: Blog[] = res.data.data;
      setFeatured(data[0] || null); // ✅ อันแรกเป็น featured
      setPosts(data.slice(1)); // ✅ ที่เหลือเป็น post list
    } catch (error) {
      console.error("Fetch home failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stripHtml = (html: string) => {
    if (typeof document === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getImageSrc = (cover?: string[] | string) => {
    // รองรับทั้ง string เดี่ยว และ array
    const img = Array.isArray(cover) ? cover[0] : cover;

    if (!img) {
      return "/default/fallback/default-placeholder.png"; // fallback
    }

    return img.startsWith("http") ? img : `${API_URL}${img}`;
  };
  return (
    <main className="container">
      {loading ? (
        <BannerSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          <Banner
            title="BlogSpace"
            subtitle="Discover stories, ideas, and insights"
            backgroundUrl="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
          />
        </motion.div>
      )}

      {/* FEATURED */}
      {loading ? (
        <FeaturedSkeleton />
      ) : featured ? (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          whileHover={{ y: -4 }}
        >
          <Link href={`/pages/blog/detail/${featured._id}`} className="block">
            <Featured
              title={featured.title}
              description={stripHtml(featured.content)}
              author={
                featured.user_id.profile?.display_name ??
                featured.user_id.username ??
                "Unknown"
              }
              date={featured.createdAt}
              imageUrl={getImageSrc(featured.cover_image)}
              className="
        group rounded-2xl overflow-hidden
        border bg-background/50
        backdrop-blur-sm
        transition-all duration-500
        hover:shadow-2xl
      "
              imageClassName="
        aspect-[16/9]
        transition-transform duration-700 ease-out
        group-hover:scale-105
      "
            />
          </Link>
        </motion.div>
      ) : null}

      {/* POST LIST */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.section
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
        >
          {posts.map((post) => (
            <Link key={post._id} href={`/pages/blog/detail/${post._id}`}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="
          group rounded-xl overflow-hidden border bg-background
          transition-all duration-300 hover:shadow-lg
          cursor-pointer
        "
              >
                {/* 🔥 image wrapper */}
                <div className="relative overflow-hidden">
                  <img
                    src={getImageSrc(post.cover_image)}
                    alt={post.title}
                    className="
              w-full aspect-[16/9] object-cover
              transition-transform duration-700 ease-out
              group-hover:scale-110
              will-change-transform
            "
                    onError={(e) => {
                      e.currentTarget.src =
                        "/default/fallback/default-placeholder.png";
                    }}
                  />

                  {/* 🔥 overlay */}
                  <div
                    className="
              absolute inset-0
              bg-gradient-to-t
              from-black/70
              via-black/10
              to-transparent
              opacity-0 group-hover:opacity-100
              transition-all duration-500
            "
                  />

                  {/* 🔥 title overlay */}
                  <div
                    className="
              absolute bottom-3 left-3 right-3
              text-white opacity-0
              group-hover:opacity-100
              transition duration-300
            "
                  >
                    <h4 className="text-sm font-semibold line-clamp-1">
                      {post.title}
                    </h4>
                  </div>
                </div>

                {/* 🔥 content */}
                <div className="p-4 space-y-2 transition-colors duration-300 group-hover:bg-muted/40">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <div
                    className="prose dark:prose-invert max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-a:text-primary prose-headings:font-head ingprose-p:leading-8"
                    dangerouslySetInnerHTML={{
                      __html: post.content,
                    }}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-1">
                      {post.tags_id?.slice(0, 2).map((tag) => (
                        <span
                          key={tag._id}
                          className="
                    text-xs bg-muted px-2 py-0.5 rounded-full
                    transition-colors group-hover:bg-primary/10
                  "
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">
                      👤{" "}
                      {post.user_id.profile?.display_name ??
                        post.user_id.username ??
                        "Unknown"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.section>
      )}
      {posts.length >= 6 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex justify-end my-5"
        >
          <Link
            href="/pages/blog/list_post"
            className="
      text-blue-700 relative inline-block
      transition-all duration-300 ease-in-out
      hover:text-blue-900 hover:-translate-y-0.5

      after:content-['']
      after:absolute
      after:left-0
      after:-bottom-1
      after:h-[2px]
      after:w-0
      after:bg-blue-700
      after:transition-all
      after:duration-300

      hover:after:w-full
    "
          >
            ดูโพสต์ทั้งหมด →
          </Link>
        </motion.div>
      )}
    </main>
  );
}
