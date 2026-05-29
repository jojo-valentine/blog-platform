"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/app/lib/config";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Calendar, Phone } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube, FaGlobe } from "react-icons/fa";
import { Pagination } from "@/app/components/ui/pagination";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import { SearchBar } from "@/app/components/ui/searchBar";
import { Label } from "@radix-ui/react-label";

type Tag = {
  _id: string;
  name: string;
};
type SocialLink = {
  platform: string;
  url: string;
};
type Blog = {
  _id: string;
  title: string;
  content?: string;
  createdAt: string;
  cover_image?: string[];
  tags_id: Tag[];
  user_id: {
    _id: string;
    name: string;
    email?: string;
    mobile?: string;
    profile?: {
      display_name?: string;
      avatar?: string;
      social_links?: SocialLink[];
    };
  };
};
const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <FaFacebook className="h-4 w-4" />;

    case "instagram":
      return <FaInstagram className="h-4 w-4" />;

    case "youtube":
      return <FaYoutube className="h-4 w-4" />;

    default:
      return <FaGlobe className="h-4 w-4" />;
  }
};
type Category = { _id: string; name: string };

export default function Page() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchProfileBlogs = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/blog/profile/list/${id}/post`,
        {
          params: {
            page,
            limit: 10,
            search: debouncedSearch,
            category: selectedIds,
          },
        },
      );

      setBlogs(res.data.data || []);
      setTotalPages(res.data.meta.totalPages);

      // เก็บ user แค่ครั้งแรก
      if (res.data.data?.length > 0) {
        setUser(res.data.data[0].user_id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, page, debouncedSearch, selectedIds]);
  const fetchCategory = useCallback(async () => {
    setLoadingCategory(true);
    try {
      const res = await axios.get(`${API_URL}/api/category/image-category`, {
        withCredentials: true,
      });
      setCategories(res.data.data);
    } catch (error: any) {
      console.error(
        "Fetch category failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoadingCategory(false);
    }
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleCategory = useCallback((ids: string[]) => {
    setSelectedIds((prev) =>
      JSON.stringify(prev) === JSON.stringify(ids) ? prev : ids,
    );
    setPage(1);
  }, []);

  // ── debounce ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!id) return;
    fetchProfileBlogs();
    fetchCategory();
  }, [id, fetchProfileBlogs, fetchCategory]);

  if (loading) {
    return (
      <div className="container max-w-6xl py-10 space-y-6">
        <Skeleton className="h-52 rounded-3xl" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }
  return (
    <div className="container max-w-6xl py-10 space-y-8">
      {/* Profile */}
      <Card className="overflow-hidden rounded-3xl border bg-background shadow-sm">
        {/* Cover */}
        <div className="relative h-44 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-muted">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
        </div>

        <CardContent className="relative p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
            {/* Left */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Avatar className="-mt-24 h-36 w-36 border-4 border-background shadow-2xl">
                <AvatarImage
                  src={
                    user.profile?.avatar
                      ? `${API_URL}${user.profile.avatar}`
                      : "/default/avatar.png"
                  }
                  onClick={() =>
                    setSelectedImage(
                      user.profile?.avatar
                        ? `${API_URL}${user.profile.avatar}`
                        : "/default/avatar.png",
                    )
                  }
                  onError={(e) => {
                    console.log(`${API_URL}${user.profile.avatar}`);
                    e.currentTarget.src =
                      "/default/fallback/default-placeholder.png";
                  }}
                />

                <AvatarFallback className="bg-primary text-4xl font-bold text-primary-foreground">
                  {(user.profile?.display_name ||
                    user.name ||
                    "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-5 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {user.profile?.display_name || user.name}
                </h1>

                <p className="text-sm text-muted-foreground">@{user.name}</p>
              </div>
            </div>

            {/* Right */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Blogs */}
              <div className="rounded-2xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">Total Blogs</p>

                <h2 className="mt-2 text-3xl font-bold">{blogs.length}</h2>
              </div>

              {/* Email */}
              {/* <div className="rounded-2xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">Email</p>

                <h2 className="mt-2 break-all text-base font-medium">
                  {user.email || "No email"}
                </h2>
              </div> */}

              {/* Mobile */}
              {/* <div className="rounded-2xl border bg-muted/30 p-5 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>

                    <p className="font-medium">
                      {user.mobile || "No mobile number"}
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Social Links */}
              <div className="rounded-2xl border bg-muted/30 p-5 sm:col-span-2">
                <p className="mb-4 text-sm text-muted-foreground">
                  Social Links
                </p>

                {user?.profile?.social_links?.length ? (
                  <div className="flex flex-wrap gap-3">
                    {user?.profile?.social_links.map(
                      (social: SocialLink, index: number) => (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm transition hover:border-primary hover:text-primary"
                        >
                          {getSocialIcon(social.platform)}

                          <span className="capitalize">{social.platform}</span>
                        </a>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No social links
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-xl">Filter Blogs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <SearchBar
                  placeholder="Search blog..."
                  value={search}
                  onValueChange={handleSearch}
                  className="w-full pl-9 rounded-lg border bg-muted/40 
                    focus-within:ring-2 focus-within:ring-primary/30 
                    transition-all duration-200"
                />
                {/* loading indicator */}
                {loading && search && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Categories</Label>
              {loadingCategory ? (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-7 w-20 rounded-full bg-muted animate-pulse"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    />
                  ))}
                </div>
              ) : (
                <CategoryCheckBox
                  value={selectedIds}
                  categories={categories}
                  onValueChange={handleCategory}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Blogs</h2>

        <p className="text-sm text-muted-foreground">
          All posts from this creator
        </p>
      </div>

      {/* Blog List */}
      {blogs.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-14 text-center text-muted-foreground">
            No blogs found
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {blogs.map((blog) => (
              <Link key={blog._id} href={`/pages/blog/detail/${blog._id}`}>
                <Card className="group h-full overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl cursor-pointer">
                  <CardContent className="p-0 h-full">
                    <div className="flex h-full flex-col">
                      {/* Cover */}
                      {blog.cover_image?.[0] && (
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={
                              blog.cover_image[0].startsWith("http")
                                ? blog.cover_image[0]
                                : `${API_URL}${blog.cover_image[0]}`
                            }
                            alt={blog.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src =
                                "/default/fallback/default-placeholder.png";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div className="space-y-3">
                          {/* Title */}
                          <div>
                            <h3 className="text-xl font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                              {blog.title}
                            </h3>

                            {blog.content && (
                              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground break-all">
                                {blog.content.replace(/<[^>]*>/g, "")}
                              </p>
                            )}
                          </div>

                          {/* Tags */}
                          {blog.tags_id?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {blog.tags_id.slice(0, 3).map((tag) => (
                                <span
                                  key={tag._id}
                                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between border-t pt-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />

                            <span>
                              {new Date(blog.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          <div className="text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            Read more →
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end pt-4"
            >
              <Pagination
                page={page}
                totalPages={totalPages}
                onValueChange={(p) => setPage(p)}
              />
            </motion.div>
          )}
        </div>
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
    </div>
  );
}
