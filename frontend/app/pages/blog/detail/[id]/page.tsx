"use client";
import React, { useCallback } from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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

const initialBlog: Blog = {
  title: "",
  content: "",
  tags_id: [],
  cover_image: [],
  gallery: [],
  createdAt: "",
  user_id: {
    username: "",
    profile: {
      avatar: "",
      display_name: "",
    },
  },
};

export default function page() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
  const stripHtml = (html: string) => {
    if (typeof document === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };
  if (!blog)
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground mb-4">Blog post not found</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );

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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
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
                src={
                  blog.cover_image?.[0]
                    ? blog.cover_image?.[0].startsWith("http") ||
                      blog.cover_image?.[0].startsWith("blob")
                      ? blog.cover_image?.[0]
                      : `${API_URL}${blog.cover_image?.[0]}`
                    : undefined
                }
                alt={blog.title}
                className="w-full aspect-[4/3] object-cover rounded-lg mb-8"
                onError={(e) => {
                  e.currentTarget.src =
                    "/default/fallback/default-placeholder.png";
                }}
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
                  src={
                    blog.user_id.profile?.avatar &&
                    (blog.user_id.profile.avatar.startsWith("http") ||
                      blog.user_id.profile.avatar.startsWith("blob"))
                      ? blog.user_id.profile.avatar
                      : blog.user_id.profile?.avatar
                        ? `${API_URL}${blog.user_id.profile.avatar}`
                        : undefined
                  }
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
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: blog.content,
              }}
            />
            {blog.gallery && blog.gallery.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-semibold mb-4">
                  Gallery
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {blog.gallery.map((img) => (
                    <div
                      key={img._id}
                      className="group overflow-hidden rounded-lg"
                    >
                      <img
                        src={
                          img.path.startsWith("http") ||
                          img.path.startsWith("blob")
                            ? img.path
                            : `${API_URL}${img.path}`
                        }
                        alt=""
                        className="rounded-lg w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default/fallback/default-placeholder.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </motion.div>
      )}
    </>
  );
}
