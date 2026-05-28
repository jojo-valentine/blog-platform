"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowBigLeft, ImagePlus, X, Save } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import Link from "next/link";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Swal from "sweetalert2";
import { CategoryCheckbox } from "@/app/components/admin/ui/categoryCheckbox";
import { EditSkeleton } from "@/app/components/admin/ui/skeleton";

const QuillEditor = dynamic(() => import("react-quill-new"), { ssr: false });

// ── Types ──
type ImageItem = { file: File; preview: string };
type Blog = {
  cover_image: File | null;
  title: string;
  categories: string[];
  content: string;
  gallery: ImageItem[];
};
type ErrorBlog = {
  cover_image: string;
  title: string;
  categories: string;
  content: string;
  gallery: string[];
};
type Category = { _id: string; name: string };

const initialBlog: Blog = {
  cover_image: null,
  title: "",
  categories: [],
  content: "",
  gallery: [],
};
const initialBlogError: ErrorBlog = {
  cover_image: "",
  title: "",
  categories: "",
  content: "",
  gallery: [],
};
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;
const errorClass = "text-sm text-red-500 mt-1";
const inputErrorClass = "border-red-500 focus-visible:ring-red-500";

export default function Page() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const mainImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ✅ แยก submit loading
  const [errorBlog, setErrorBlog] = useState<ErrorBlog>(initialBlogError);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<Blog>(initialBlog);

  // ── Fetch categories ──
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
    if (!loadingAuth && !user) {
      router.push("/");
      return;
    }

    fetchCategory();
  }, [user, loadingAuth, fetchCategory]);

  // ── Handlers ──
  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorBlog((prev) => ({
        ...prev,
        cover_image: "ไฟล์ต้องเป็น JPG, PNG หรือ WEBP",
      }));
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrorBlog((prev) => ({ ...prev, cover_image: "ไฟล์ต้องไม่เกิน 5MB" }));
      return;
    }
    setBlogForm((prev) => ({ ...prev, cover_image: file }));
    setMainImagePreview(URL.createObjectURL(file));
    setErrorBlog((prev) => ({ ...prev, cover_image: "" })); // ✅ clear error
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE,
    );

    if (blogForm.gallery.length + validFiles.length > MAX_IMAGES) {
      setErrorBlog((prev) => ({
        ...prev,
        gallery: [`อัปโหลดได้สูงสุด ${MAX_IMAGES} รูป`],
      }));
      return;
    }
    setBlogForm((prev) => ({
      ...prev,
      gallery: [
        ...prev.gallery,
        ...validFiles.map((f) => ({
          file: f,
          preview: URL.createObjectURL(f),
        })),
      ],
    }));
    setErrorBlog((prev) => ({ ...prev, gallery: [] }));
  };

  const removeAdditionalImage = (index: number) => {
    setBlogForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setBlogForm((prev) => ({ ...prev, [id]: value }));
    setErrorBlog((prev) => ({ ...prev, [id]: "" }));
  };

  const handleContentChange = (val: string | undefined) => {
    setBlogForm((prev) => ({ ...prev, content: val ?? "" }));
    setErrorBlog((prev) => ({ ...prev, content: "" }));
  };

  // ── Submit ──
  const handleSubmitBlogFrom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorBlog(initialBlogError);

    try {
      const formData = new FormData();
      if (blogForm.cover_image)
        formData.append("cover_image", blogForm.cover_image);
      formData.append("title", blogForm.title);
      formData.append("content", blogForm.content);
      blogForm.categories.forEach((tag) => formData.append("categories", tag));
      blogForm.gallery.forEach((img) => formData.append("gallery", img.file));

      await axios.post(`${API_URL}/api/blog/create`, formData, {
        withCredentials: true,
      });

      // ✅ reset form
      setMainImagePreview(null);
      setBlogForm(initialBlog);

      Swal.fire({
        title: "Created successfully 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => router.push("/admin/pages/posts"));
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialBlogError);
        err.errors.forEach((e: { field: keyof ErrorBlog; message: string }) => {
          if (e.field.startsWith("gallery")) {
            fieldErrors.gallery.push(e.message);
          } else {
            (fieldErrors as any)[e.field] = e.message;
          }
        });
        setErrorBlog(fieldErrors);
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          text: "Please check your inputs",
        });
      } else {
        Swal.fire({
          title: "Error",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          text: err?.message || "Something went wrong",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth)
    return (
      <ContentLayout title="create blog">
        <EditSkeleton />
      </ContentLayout>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ContentLayout title="create blog">
        <div className="container max-w-4xl py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-bold">
              Create Blog Post
            </h1>
            <Button variant="outline" asChild>
              <Link href="/admin/pages/posts">
                <ArrowBigLeft className="mr-1.5 h-4 w-4" /> Back
              </Link>
            </Button>
          </div>

          <form onSubmit={handleSubmitBlogFrom}>
            {/* Main Image */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Main Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mainImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={mainImagePreview}
                      alt="Main"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMainImagePreview(null);
                        setBlogForm((prev) => ({ ...prev, cover_image: null }));
                      }}
                      className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background hover:bg-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainImageRef.current?.click()}
                    className={`cursor-pointer w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 transition-colors ${errorBlog.cover_image ? inputErrorClass : ""}`}
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">Click to upload main image</span>
                  </button>
                )}
                <input
                  ref={mainImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMainImage}
                />
                {errorBlog.cover_image && (
                  <p className={errorClass}>{errorBlog.cover_image}</p>
                )}
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter your blog title"
                    value={blogForm.title}
                    onChange={handleChange}
                    required
                    className={errorBlog.title ? inputErrorClass : ""}
                  />
                  {errorBlog.title && (
                    <p className={errorClass}>{errorBlog.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <QuillEditor
                    value={blogForm.content}
                    onChange={handleContentChange}
                    theme="snow"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["clean"],
                      ],
                    }}
                    style={{ height: "300px", marginBottom: "50px" }}
                    className={errorBlog.content ? inputErrorClass : ""}
                  />
                  {errorBlog.content && (
                    <p className={errorClass}>{errorBlog.content}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <CategoryCheckbox
                    categories={categories}
                    value={blogForm.categories}
                    onChange={(value) =>
                      setBlogForm((prev) => ({ ...prev, categories: value }))
                    }
                  />
                  {errorBlog.categories && (
                    <p className={errorClass}>{errorBlog.categories}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Additional Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {blogForm.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden aspect-square"
                    >
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(i)}
                        className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {blogForm.gallery.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => imagesRef.current?.click()}
                      className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">
                        Add ({blogForm.gallery.length}/{MAX_IMAGES})
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={imagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalImages}
                />
                {errorBlog.gallery.length > 0 && (
                  <p className={errorClass}>{errorBlog.gallery[0]}</p>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? "Creating..." : "Create Blog Post"}
            </Button>
          </form>
        </div>
      </ContentLayout>
    </motion.div>
  );
}
