"use client";
import { useCallback } from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import BlogHeroSkeleton from "@/app/components/skeleton/blog-detail/hero-skeleton";
import BlogHeaderSkeleton from "@/app/components/skeleton/blog-detail/header-skeleton";
import BlogContentSkeleton from "@/app/components/skeleton/blog-detail/blog-content-skeleton";
import BlogGallerySkeleton from "@/app/components/skeleton/blog-detail/blog-gallery-skeleton";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { motion } from "framer-motion";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
type Gallery = {
  _id: string;
  path: string;
};

type Blog = {
  // _id: string;
  title: string;
  content: string;
  tags_id: Category[]; // ✅ แก้ตรงนี้
  cover_image: string[];
  createdAt: string;
  gallery: Gallery[];
  user_id: {
    username: string;
    profile?: {
      avatar?: string;
      display_name: string;
    };
  };
};
type Category = {
  _id: string;
  name: string;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/${id}/detail`);
      const data = res.data.data;
      setBlog({
        title: data.title,
        content: data.content,
        tags_id: data.tags_id,
        cover_image: data.cover_image || [],
        gallery: (data.images || []).map(
          (img: { _id: string; path: string }) => ({
            _id: img._id,
            path: img.path,
          }),
        ),

        createdAt: data.createdAt,
        user_id: {
          username: data.user_id.username,
          profile: {
            display_name: data.user_id.profile?.display_name || "",
            avatar: data.user_id.profile?.avatar || "",
          },
        },
      });
      // setFeatured(data[0] || null); // ✅ อันแรกเป็น featured
      // setPosts(data.slice(1)); // ✅ ที่เหลือเป็น post list
    } catch (error) {
      console.error("Fetch detail failed:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="w-16 h-4 bg-muted rounded animate-pulse" />

        <BlogHeroSkeleton />
        <BlogHeaderSkeleton />
        <BlogContentSkeleton />
        <BlogGallerySkeleton />
      </div>
    );
  }
  if (!blog)
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground mb-4">Blog post not found</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );

  const getImageSrc = (
    path?: string,
    fallback = "/default/fallback/default-placeholder.png",
  ) => {
    if (!path) return fallback;

    if (path.startsWith("http") || path.startsWith("blob")) {
      return path;
    }

    return `${API_URL}${path}`;
  };

  return (
    <>
      {loading ? (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* back */}
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />

          <BlogHeroSkeleton />
          <BlogHeaderSkeleton />
          <BlogContentSkeleton />
          <BlogGallerySkeleton />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full p-6 rounded-xl shadow-lg"
        >
          <article className="container max-w-3xl py-10 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {blog.cover_image && (
              <img
                src={getImageSrc(blog.cover_image?.[0])}
                alt={blog.title}
                className="w-full aspect-[16/9] object-cover rounded-2xl mb-8 shadow-xl transition-transform duration-700 hover:scale-[1.01] "
                onError={(e) => {
                  e.currentTarget.src =
                    "/default/fallback/default-placeholder.png";
                }}
                onClick={() =>
                  setSelectedImage(getImageSrc(blog.cover_image?.[0]))
                }
              />
            )}
            <h1 className="font-heading text-4xl font-bold mb-4 text-balance">
              {blog.title}
            </h1>

            {/* 👇 ตรงนี้ */}
            {blog.tags_id?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags_id.map((tag) => (
                  <span
                    key={tag._id}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 transition hover:bg-primary hover:text-white"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mb-8 pb-8 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={getImageSrc(
                    blog.user_id.profile?.avatar,
                    "/default/avatar.png",
                  )}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {(blog.user_id.profile?.display_name ?? "A")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {blog.user_id.profile?.display_name ?? "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div
              className="prose dark:prose-invert max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-a:text-primary prose-headings:font-head ingprose-p:leading-8"
              dangerouslySetInnerHTML={{
                __html: blog.content,
              }}
            />
            {blog.gallery && blog.gallery.length > 0 && (
              <motion.div
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
                className="mt-10"
              >
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Gallery
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {blog.gallery.map((img) => (
                    <motion.div
                      key={img._id}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        show: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ y: -4 }}
                      onClick={() =>
                        setSelectedImage(
                          img.path.startsWith("http") ||
                            img.path.startsWith("blob")
                            ? img.path
                            : `${API_URL}${img.path}`,
                        )
                      }
                      className="group relative overflow-hidden rounded-xl cursor-pointer "
                    >
                      <img
                        src={
                          img.path.startsWith("http") ||
                          img.path.startsWith("blob")
                            ? img.path
                            : `${API_URL}${img.path}`
                        }
                        alt=""
                        className="w-full aspect-square object-cover transition-transform duration-500 ease-out group-hover:scale-110 will-change-transform"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default/fallback/default-placeholder.png";
                        }}
                      />

                      {/* 🔥 overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300" />
                      {/* 🔥 shine effect */}
                      <div className=" absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </article>
        </motion.div>
      )}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedImage(null)}
          className="
          fixed inset-0 z-50
          bg-black/80 backdrop-blur-sm
          flex items-center justify-center
          p-4
        "
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            src={selectedImage}
            alt=""
            className="
            max-h-[90vh]
            max-w-[90vw]
            rounded-xl
            shadow-2xl
            object-contain
          "
            onClick={(e) => e.stopPropagation()}
          />

          {/* close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="
            absolute top-4 right-4
            text-white text-3xl
            hover:scale-110 transition
          "
          >
            ✕
          </button>
        </motion.div>
      )}
    </>
  );
}
