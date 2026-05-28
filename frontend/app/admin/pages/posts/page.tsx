"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/lib/format-date";
import { motion } from "framer-motion";
import {
  PenSquare,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Calendar,
  SquarePen,
  Globe,
  Ban,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/app/lib/config";
import { Label } from "@/app/components/admin/ui/label";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import Swal, { SweetAlertResult } from "sweetalert2";
import { PaginationTable } from "@/app/components/admin/ui/pagination_custom";
import { Skeleton, TableSkeleton } from "@/app/components/admin/ui/skeleton";
interface Blog {
  _id: string;
  title: string;
  content: string;
  tags_id: category[]; // ✅ แก้ตรงนี้
  cover_image: string[] | null;
  gallery: gallery[];
  is_online: boolean;
  suspended: boolean;
  createdAt: string;
  deletedAt: string;
}
type category = {
  _id: string;
  name: string;
};
type gallery = {
  _id: string;
  path: string;
};
export default function pagePosts() {
  const { user, loading: loadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const router = useRouter();
  const [categories, setCategories] = useState<category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingToggleSuspend, setLoadingToggleSuspend] = useState<
    string | null
  >(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/list/blogs`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          category: selectedIds,
        },
      });

      const response = res.data;

      setBlogs(
        response.data.map((blog: any) => ({
          ...blog,
          gallery: blog.images,
        })),
      );

      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      console.error(
        "Fetch data failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedIds]);

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

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1); // reset page เมื่อเปลี่ยน keyword
  };
  const handleCategory = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(ids)) return prev;
      return ids;
    });
    setPage(1);
  }, []);

  const handleSuspend = async (id: string, suspended: boolean) => {
    try {
      setLoadingToggleSuspend(id);

      await axios.patch(
        `${API_URL}/api/admin/${id}/blogs/suspension`,
        {
          suspended: !suspended,
        },
        {
          withCredentials: true,
        },
      );

      setBlogs((prev) =>
        prev.map((blog) =>
          blog._id === id
            ? {
                ...blog,
                suspended: !suspended,
              }
            : blog,
        ),
      );

      Swal.fire({
        title: "Success",
        icon: "success",
        timer: 1500,
        text: !suspended
          ? "Blog suspended successfully"
          : "Blog unsuspended successfully",
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        timer: 1500,
        text: error.response?.data?.message || error.message,
        showConfirmButton: false,
      });
    } finally {
      setLoadingToggleSuspend(null);
    }
  };
  const deleteBlog = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete blog?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    // ❌ กดยกเลิก
    if (!result.isConfirmed) return;

    setLoadingDeleteId(id);

    try {
      await axios.delete(`${API_URL}/api/blog/${id}/delete`, {
        withCredentials: true,
      });

      // ✅ update state
      setBlogs((prev) =>
        prev.map((blog) =>
          blog._id === id
            ? {
                ...blog,
                deletedAt: new Date().toISOString(),
              }
            : blog,
        ),
      );

      Swal.fire({
        title: "Deleted 🎉",
        text: "Blog has been deleted.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Delete failed",
      });
    } finally {
      setLoadingDeleteId(null);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1500); // ⏱ 500ms

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/");
      return;
    }
    fetchData();
    fetchCategory();
  }, [user, fetchData, fetchCategory, page, debouncedSearch, selectedIds]);
  return (
    <ContentLayout title="categories">
      <div className="mb-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Blog Posts
            </h2>

            <p className="text-sm text-muted-foreground">Manage blog posts</p>
          </div>

          <Button
            variant="outline"
            type="button"
            className="flex items-center gap-2 cursor-pointer bg-green-500 text-white hover:bg-green-600 px-3 py-2 rounded-md"
            onClick={() => router.push("/admin/pages/posts/create/")}
          >
            <Plus className="w-4 h-4" />

            <span>Add Post</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>

            <input
              type="text"
              placeholder="Search post..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className=" w-72 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring "
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categories</Label>

            <CategoryCheckBox
              value={selectedIds}
              categories={categories}
              onValueChange={handleCategory}
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Cover</th>

              <th className="px-4 py-3 text-left">Title</th>

              <th className="px-4 py-3 text-left">Categories</th>

              <th className="px-4 py-3 text-left">Gallery</th>

              <th className="px-4 py-3 text-left">Status</th>

              <th className="px-4 py-3 text-left">Created</th>

              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton length={7} colSpan={7} />
            ) : blogs.length > 0 ? (
              blogs.map((blog, i) => (
                <tr
                  key={blog._id || i}
                  className="bg-neutral-primary border-b border-default"
                >
                  {/* Cover */}
                  <td className="px-4 py-4">
                    <img
                      src={
                        blog.cover_image?.[0]
                          ? blog.cover_image[0].startsWith("http")
                            ? blog.cover_image[0]
                            : `${API_URL}${blog.cover_image[0]}`
                          : "/default/fallback/default-placeholder.png"
                      }
                      onError={(e) => {
                        e.currentTarget.src =
                          "/default/fallback/default-placeholder.png";
                      }}
                      alt={blog.title}
                      className="h-16 w-16 rounded-md object-cover border"
                      onClick={() =>
                        setSelectedImage(
                          blog.cover_image?.[0]
                            ? blog.cover_image[0].startsWith("http")
                              ? blog.cover_image[0]
                              : `${API_URL}${blog.cover_image[0]}`
                            : "/default/fallback/default-placeholder.png",
                        )
                      }
                    />
                  </td>

                  {/* Title */}
                  <td className="px-4 py-4">
                    <div className="max-w-[240px]">
                      <h3 className=" font-medium text-foreground line-clamp-1">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {blog._id}
                      </p>
                    </div>
                  </td>
                  {/* Categories */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {blog.tags_id?.length > 0 ? (
                        blog.tags_id.map((tag) => (
                          <span
                            key={tag._id}
                            className=" rounded-full bg-muted px-2 py-1 text-xs "
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <div className="flex -space-x-2">
                          <p>not have tag category</p>
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Gallery */}
                  <td className="px-4 py-4">
                    <div className="flex -space-x-2">
                      {blog.gallery.length > 0 ? (
                        blog.gallery?.slice(0, 5).map((img) => (
                          <img
                            key={img._id}
                            src={
                              img.path.startsWith("http")
                                ? img.path
                                : `${API_URL}${img.path}`
                            }
                            onError={(e) => {
                              e.currentTarget.src =
                                "/default/fallback/default-placeholder.png";
                            }}
                            className=" h-10 w-10 rounded-full border-2 border-background object-cover"
                            onClick={() =>
                              setSelectedImage(
                                img.path.startsWith("http")
                                  ? img.path
                                  : `${API_URL}${img.path}`,
                              )
                            }
                          />
                        ))
                      ) : (
                        <div className="flex -space-x-2">
                          <p>not have gallery</p>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={`
                        rounded-full
                        px-2
                        py-1
                        text-xs
                        font-medium
                        ${
                          blog.deletedAt
                            ? "bg-gray-500/10 text-gray-600"
                            : blog.suspended
                              ? "bg-red-500/10 text-red-600"
                              : blog.is_online
                                ? "bg-green-500/10 text-green-600"
                                : "bg-yellow-500/10 text-yellow-600"
                        }
                      `}
                    >
                      {blog.deletedAt
                        ? "Deleted"
                        : blog.suspended
                          ? "Suspended"
                          : blog.is_online
                            ? "Published"
                            : "Draft"}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(blog.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          router.push(`/admin/pages/posts/${blog._id}`)
                        }
                      >
                        <SquarePen className="w-4 h-4" />
                      </Button>

                      {/* Suspend Toggle */}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={loadingToggleSuspend === blog._id}
                        className={`cursor-pointer transition-colors ${loadingToggleSuspend === blog._id ? "opacity-50 cursor-not-allowed" : ""}${blog.suspended ? "hover:bg-green-500/10 hover:text-green-600" : "hover:bg-yellow-500/10 hover:text-yellow-600"}`}
                        onClick={() => handleSuspend(blog._id, blog.suspended)}
                      >
                        {loadingToggleSuspend === blog._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : blog.suspended ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                      </Button>
                      {blog.deletedAt == null && (
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          disabled={loadingDeleteId === blog._id}
                          className={`
                            cursor-pointer transition-colors
                            ${loadingDeleteId === blog._id ? "opacity-50 cursor-not-allowed" : ""}
                            ${
                              blog.suspended
                                ? "hover:bg-green-500/10 hover:text-green-600"
                                : "hover:bg-red-500/10 hover:text-red-600"
                            }
                          `}
                          onClick={() => deleteBlog(blog._id)}
                        >
                          {loadingDeleteId === blog._id ? (
                            <Loader2 className="w-4 h-4 animate-spin " />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-muted-foreground "
                >
                  No blog post found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end pt-4"
        >
          <PaginationTable
            page={page}
            totalPages={totalPages}
            onValueChange={(p) => setPage(p)}
          />
        </motion.div>
      )}
    </ContentLayout>
  );
}
