"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { motion } from "framer-motion";
import { PenSquare, Trash2, Eye, EyeOff, Plus, Calendar } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
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

interface Blog {
  id: string;
  title: string;
  detail: string;
  main_image_url: string | null;
  is_online: boolean;
  created_at: string;
}
export default function Page() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/data-list`, {
        withCredentials: true, // ✅ ส่ง cookie ไปด้วย
      });

      // ใช้ res.data ได้เลย
      console.log(res.data);
    } catch (error: any) {
      console.error(
        "Fetch data failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchCategory = async () => {
    setLoadingCategory(true);
    try {
      const res = await axios.get(`${API_URL}/api/category/image-category`, {
        withCredentials: true,
      });

      setCategories(res.data); // หรือ res.data.data แล้วแต่ API
    } catch (error: any) {
      console.error(
        "Fetch category failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoadingCategory(false);
    }
  };
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/");
    }
    if (user) {
      fetchData();
      fetchCategory(); // 🔥 เรียกเพิ่มตรงนี้
    }
  }, [user, loadingAuth]);
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
                <Card key={blog.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {blog.main_image_url && (
                        <img
                          src={blog.main_image_url}
                          alt=""
                          className="w-40 h-32 object-cover flex-shrink-0 hidden sm:block"
                        />
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-heading font-semibold text-lg truncate">
                              {blog.title}
                            </h3>
                            <span
                            //   className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${blog.is_online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {blog.detail}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(blog.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {blog.is_online ? "Online" : "Offline"}
                              </span>
                              <Switch
                                checked={blog.is_online}
                                // onCheckedChange={() =>
                                //   toggleOnline(blog.id, blog.is_online)
                                // }
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              //   onClick={() => navigate(`/blog/edit/${blog.id}`)}
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
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    // onClick={() => deleteBlog(blog.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
