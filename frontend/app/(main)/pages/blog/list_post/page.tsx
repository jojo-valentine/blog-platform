"use client";
import { PostSkeleton } from "@/app/components/skeleton/post-skeleton";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import { SearchBar } from "@/app/components/ui/searchBar";
import { Label } from "@radix-ui/react-label";
import { Pagination } from "@/app/components/ui/pagination";

type Blog = {
  _id: string;
  title: string;
  content: string;
  cover_image: string[];
  tags_id: { _id: string; name: string }[];
  createdAt: string;
  user_id: {
    username?: string;
    profile?: { display_name: string };
  };
};

type Category = { _id: string; name: string };

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const, // ✅ เพิ่ม as const
    },
  },
};

const stripHtml = (html: string) => {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [posts, setPosts] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── debounce ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ── fetch blogs ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/public`, {
        params: {
          page,
          limit: 9,
          search: debouncedSearch,
          category: selectedIds,
        },
      });
      setPosts(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error("Fetch blog failed:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedIds]);

  // ── fetch categories ──
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

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getImageSrc = (image?: string) => {
    if (!image) return "/default/fallback/default-placeholder.png";
    return image.startsWith("http") || image.startsWith("blob")
      ? image
      : `${API_URL}${image}`;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* ── Filter Card ── */}
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

      {/* ── Post Grid ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium">No blogs found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <motion.section
            key={`${page}-${debouncedSearch}-${selectedIds.join()}`}
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {posts.map((post) => (
              <Link key={post._id} href={`/pages/blog/detail/${post._id}`}>
                <motion.div
                  variants={item}
                  whileHover={{ y: -6 }}
                  className="group rounded-xl overflow-hidden border bg-background
                    hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={getImageSrc(post.cover_image?.[0])}
                      alt={post.title}
                      className="w-full aspect-[16/9] object-cover
                        transition-transform duration-500 group-hover:scale-[1.06]"
                      onError={(e) => {
                        e.currentTarget.src =
                          "/default/fallback/default-placeholder.png";
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div
                      className="absolute bottom-3 left-3 right-3 text-white
                      opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                      transition-all duration-300"
                    >
                      <p className="text-xs line-clamp-1">{post.title}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2 group-hover:bg-muted/30 transition-colors duration-300">
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {stripHtml(post.content)}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap gap-1">
                        {post.tags_id?.slice(0, 2).map((tag) => (
                          <span
                            key={tag._id}
                            className="text-xs bg-muted px-2 py-0.5 rounded-full
                              group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {post.user_id?.profile && (
                      <p className="text-xs text-muted-foreground pt-1">
                        👤{" "}
                        {post.user_id.profile.display_name ??
                          post.user_id.username ??
                          "Unknown"}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

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
  );
}
