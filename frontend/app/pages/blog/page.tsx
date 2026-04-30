"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { motion } from "framer-motion";
import { PenSquare, Trash2, Eye, EyeOff, Plus, Calendar ,Loader2  } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import { SearchBar } from "@/app/components/ui/searchBar";
import { Pagination } from "@/app/components/ui/pagination";
import Swal from "sweetalert2";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { Input } from "@/app/components/ui/input";
import { Label } from "@radix-ui/react-label";

interface Blog {
  _id: string;
  title: string;
  content: string;
  tags_id: Category[]; // ✅ แก้ตรงนี้
  cover_image: string | null;
  is_online: boolean;
  createdAt: string;
}
type Category = {
  _id: string;
  name: string;
};
export default function Page() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // list ทั้งหมด
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // สิ่งที่เลือก
  const [debouncedSearch, setDebouncedSearch] = useState(""); // ใช้ยิง API
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loadingToggleIds, setLoadingToggleIds] = useState<string[]>([]);
  const [loadingDeleteIds, setLoadingDeleteIds] = useState<string[]>([]);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/data-list`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          category: selectedIds,
        },
      });

      const data = res.data;
      setBlogs(data.data);
      setTotalPages(data.meta.totalPages);
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
  // ✅ แยก useEffect ออกมา รันแค่ครั้งเดียว
  useEffect(() => {
    if (user) fetchCategory();
  }, [user, fetchCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1500); // ⏱ 500ms

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData, page, debouncedSearch, selectedIds]);
  const stripHtml = (html: string) => {
    if (typeof document === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };
  const handleToggleBlog = async (id: string, current: boolean) => {
    const prevBlogs = blogs;
    if (loadingToggleIds.includes(id)) return;
    // ✅ optimistic

    // ✅ set loading เฉพาะตัว
    setLoadingToggleIds((prev) => [...prev, id]);

    setBlogs((prev) =>
      prev.map((b) => (b._id === id ? { ...b, is_online: current } : b)),
    );

    try {
      const res = await axios.patch(
        `${API_URL}/api/blog/${id}/toggle`,
        { is_online: current },
        { withCredentials: true },
      );

      Swal.fire({
        title: "Update successfully 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      // ❗ rollback
      setBlogs(prevBlogs);

      const message =
        error.response?.data?.message || error.message || "Update failed";

      Swal.fire({
        title: "Error update fail",
        icon: "error",
        text: message,
      });
    } finally {
      // ✅ เอา id ออกจาก loading
      setLoadingToggleIds((prev) => prev.filter((i) => i !== id));
    }
  };
  const deleteBlog = async (id: string) => {
    if (loadingDeleteIds.includes(id)) return;

    const prevBlogs = blogs;

    setLoadingDeleteIds((prev) => [...prev, id]);

    // ✅ ใช้ functional update
    setBlogs((prev) => {
      const newBlogs = prev.filter((b) => b._id !== id);

      if (newBlogs.length === 0 && page > 1) {
        setPage((p) => p - 1);
      }

      return newBlogs;
    });

    try {
      await axios.delete(`${API_URL}/api/blog/${id}/delete`, {
        withCredentials: true,
      });

      Swal.fire({
        title: "Deleted 🎉",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      setBlogs(prevBlogs);

      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Delete failed",
      });
    } finally {
      setLoadingDeleteIds((prev) => prev.filter((i) => i !== id));
    }
  };
  if (loadingAuth) return <p>Loading...</p>;
  if (!user) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 rounded-xl shadow-lg"
    >
      <div className="container max-w-4xl py-10 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">My Blogs</h1>
          <Button asChild>
            <Link href="/pages/blog/create">
              <Plus className="mr-1.5 h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>
        <div>
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">
                Filter Blogs
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 🔍 Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <SearchBar
                  placeholder="Search blog..."
                  value={search}
                  onValueChange={handleSearch} // ✅ รับ string ตรง ๆ
                />
              </div>

              {/* 🏷 Category */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <CategoryCheckBox
                  value={selectedIds}
                  categories={categories}
                  onValueChange={handleCategory}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          {loading ? (
            <p className="text-center text-muted-foreground py-20">
              Loading...
            </p>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">
                You haven't written any blog posts yet.
              </p>
              <Button asChild>
                <Link href="/pages/blog/create">Write Your First Post</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <Card key={blog._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-wrap">
                      {blog.cover_image && (
                        <img
                          src={
                            blog.cover_image?.[0]?.startsWith("http")
                              ? blog.cover_image[0]
                              : `${API_URL}${blog.cover_image?.[0] ?? ""}`
                          }
                          alt="Blog cover image"
                          className="w-full sm:w-48 h-52 object-cover rounded-lg shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/default/fallback/default-placeholder.png";
                          }}
                        />
                      )}

                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-heading font-semibold text-lg truncate">
                              {blog.title}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${blog.is_online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                            >
                              {blog.is_online ? (
                                <>
                                  <Eye className="h-3 w-3" /> Online
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" /> Offline
                                </>
                              )}
                            </span>
                          </div>
                          {/* 🔹 Row 2: Tags */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {blog.tags_id?.map((t) => (
                              <span
                                key={t._id}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>

                          {/* <div
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                          /> */}
                          <div>
                            <div className=" line-clamp-2">
                              {stripHtml(blog.content)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={blog.is_online}
                                onCheckedChange={(checked) =>
                                  handleToggleBlog(blog._id, checked)
                                }
                                disabled={loadingToggleIds.includes(blog._id)}
                              />

                              <span className="text-xs text-muted-foreground min-w-[70px]">
                                {loadingToggleIds.includes(blog._id)
                                  ? "Updating..."
                                  : blog.is_online
                                    ? "Online"
                                    : "Offline"}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/pages/blog/${blog._id}`)
                              }
                            >
                              <PenSquare className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete blog post?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    disabled={loadingDeleteIds.includes(
                                      blog._id,
                                    )}
                                  >
                                    Cancel
                                  </AlertDialogCancel>

                                  {/* ✅ เปลี่ยนจาก AlertDialogAction เป็น Button */}
                                  <Button
                                    onClick={() => deleteBlog(blog._id)}
                                    disabled={loadingDeleteIds.includes(
                                      blog._id,
                                    )}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {loadingDeleteIds.includes(blog._id) ? (
                                      <span className="flex items-center gap-1">
                                        <Loader2  className="h-3 w-3 animate-spin" />
                                        Deleting...
                                      </span>
                                    ) : (
                                      "Delete"
                                    )}
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onValueChange={(p) => setPage(p)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
