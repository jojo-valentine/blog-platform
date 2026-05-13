"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import Link from "next/link";
import { ArrowBigLeft, ImagePlus, X, Save } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { CategoryCheckbox } from "@/app/components/admin/ui/categoryCheckbox";
import { EditSkeleton } from "@/app/components/admin/ui/skeleton";
const QuillEditor = dynamic(() => import("react-quill-new"), { ssr: false });

// ── Types ──
type ImageItem = { file: File; preview: string };
type Gallery = { _id: string; path: string };
type Category = { _id: string; name: string };
type Blog = {
  _id: string;
  title: string;
  content: string;
  tags_id: Category[];
  cover_image: string[];
  gallery: Gallery[];
};
type ErrorBlog = {
  cover_image: string;
  title: string;
  categories: string;
  content: string;
  gallery: string[];
};

const initialBlog: Blog = {
  _id: "",
  title: "",
  content: "",
  tags_id: [],
  cover_image: [],
  gallery: [],
};
const initialBlogError: ErrorBlog = {
  cover_image: "",
  title: "",
  categories: "",
  content: "",
  gallery: [],
};
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const errorClass = "text-sm text-red-500 mt-1";
const inputErrorClass = "border-red-500 focus-visible:ring-red-500";

export default function PageEdit() {
  const { user, loading: loadingAuth } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [blogForm, setBlogForm] = useState<Blog>(initialBlog);
  const [errorBlog, setErrorBlog] = useState<ErrorBlog>(initialBlogError);
  const [categories, setCategories] = useState<Category[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newGallery, setNewGallery] = useState<ImageItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // ✅ skeleton
  const [submitting, setSubmitting] = useState(false);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  // ── Fetch blog ──
  const fetchBlogEdit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blog/${id}/edit`, {
        withCredentials: true,
      });
      const data = res.data.data;
      setBlogForm({
        ...data,
        title: data.title || "",
        tags_id: data.tags_id || [],
        cover_image: data.cover_image || [],
        gallery: (data.images || []).map(
          (img: { _id: string; path: string }) => ({
            _id: img._id,
            path: img.path.startsWith("http")
              ? img.path
              : `${API_URL}${img.path}`,
          }),
        ),
        content: data.content || "",
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Fetch categories ──
  const fetchCategory = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/");
      return;
    }
    if (id) fetchBlogEdit();
    fetchCategory();
  }, [user, id, loadingAuth, router, fetchBlogEdit, fetchCategory]);

  // ── Image src ──
  const img = preview || blogForm.cover_image?.[0];
  const imageSrc = img
    ? img.startsWith("http") || img.startsWith("blob")
      ? img
      : `${API_URL}${img}`
    : undefined;

  // ── Handlers ──
  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("ไฟล์ต้องเป็น JPG, PNG หรือ WEBP");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setNewImage(file);
    setPreview(URL.createObjectURL(file));
    setErrorBlog((prev) => ({ ...prev, cover_image: "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id: fieldId, value } = e.target;
    setBlogForm((prev) => ({ ...prev, [fieldId]: value }));
    setErrorBlog((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const handleContentChange = (val: string | undefined) => {
    setBlogForm((prev) => ({ ...prev, content: val ?? "" }));
    setErrorBlog((prev) => ({ ...prev, content: "" }));
  };

  const handleCategoryChange = (value: string[]) => {
    setBlogForm((prev) => ({
      ...prev,
      tags_id: value.map((id) => ({ _id: id, name: "" })),
    }));
    setErrorBlog((prev) => ({ ...prev, categories: "" }));
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewGallery((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
    ]);
  };

  // ── Submit ──
  const handleUpdateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", blogForm.title);
    form.append("content", blogForm.content);
    blogForm.tags_id.forEach((tag) => form.append("categories", tag._id));
    if (newImage) form.append("cover_image", newImage);
    newGallery.forEach((img) => form.append("gallery", img.file));

    setSubmitting(true);
    try {
      await axios.patch(`${API_URL}/api/blog/${id}/update`, form, {
        withCredentials: true,
      });
      Swal.fire({
        title: "Update Successfully 🎉",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Go to Blog",
        cancelButtonText: "Stay Here",
      }).then((result) => {
        if (result.isConfirmed) router.push("/admin/pages/posts");
      });
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialBlogError);
        err.errors.forEach((e: { field: keyof ErrorBlog; message: string }) => {
          if (e.field === "gallery" || e.field.startsWith("gallery")) {
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

  // ── Delete gallery image ──
  const handleDeleteImage = async (imageId: string) => {
    if (!imageId || deletingIds.includes(imageId)) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    setDeletingIds((prev) => [...prev, imageId]);
    const prevGallery = blogForm.gallery;
    setBlogForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((img) => img._id !== imageId),
    }));

    try {
      await axios.delete(`${API_URL}/api/blog/${imageId}/image`, {
        withCredentials: true,
      });
      Swal.fire({
        title: "Deleted!",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      setBlogForm((prev) => ({ ...prev, gallery: prevGallery }));
      Swal.fire({
        title: "Error",
        text: "There was a problem deleting the image.",
        icon: "error",
      });
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== imageId));
    }
  };

  // ── Render ──
  if (loading)
    return (
      <ContentLayout title="edit blog">
        <EditSkeleton />
      </ContentLayout>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ContentLayout title="edit blog">
        <div className="container max-w-4xl py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-bold">Edit Blog Post</h1>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/pages/posts">
                <ArrowBigLeft className="mr-1.5 h-4 w-4" /> Back
              </Link>
            </Button>
          </div>

          <form onSubmit={handleUpdateForm}>
            <Card className="mb-6">
              {/* Main Image */}
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Main Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {imageSrc ? (
                    <>
                      <img
                        src={imageSrc}
                        className={`w-full h-64 object-cover rounded-lg ${errorBlog.cover_image ? "border-2 border-red-500" : ""}`}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default/fallback/default-placeholder.png";
                        }}
                      />
                      {newImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreview(null);
                            setNewImage(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => mainImageRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-sm"
                      >
                        Change
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => mainImageRef.current?.click()}
                      className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 transition-colors ${errorBlog.cover_image ? inputErrorClass : ""}`}
                    >
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm">
                        Click to upload main image
                      </span>
                    </button>
                  )}
                  {errorBlog.cover_image && (
                    <p className={errorClass}>{errorBlog.cover_image}</p>
                  )}
                  <input
                    ref={mainImageRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleMainImage}
                  />
                </div>
              </CardContent>

              {/* Content */}
              <CardHeader>
                <CardTitle className="font-heading text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    id="title"
                    value={blogForm.title}
                    onChange={handleChange}
                    className={errorBlog.title ? inputErrorClass : ""}
                    required
                  />
                  {errorBlog.title && (
                    <p className={errorClass}>{errorBlog.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
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
                    value={blogForm.tags_id.map((cat) => cat._id)}
                    onChange={handleCategoryChange}
                  />
                  {errorBlog.categories && (
                    <p className={errorClass}>{errorBlog.categories}</p>
                  )}
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label>Gallery</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {blogForm.gallery.map((img, i) => {
                      const isDeleting = deletingIds.includes(img._id);
                      return (
                        <div
                          key={img._id}
                          className={`relative rounded-lg overflow-hidden aspect-square ${isDeleting ? "opacity-50" : ""}`}
                        >
                          <img
                            src={img.path}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "/default/fallback/default-placeholder.png";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img._id)}
                            className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                          >
                            {isDeleting ? (
                              <span className="text-xs px-1">...</span>
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                            old
                          </span>
                        </div>
                      );
                    })}

                    {newGallery.map((img, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={img.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewGallery((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-green-600 text-white px-1 rounded">
                          new
                        </span>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => imagesRef.current?.click()}
                      className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Add</span>
                    </button>
                  </div>
                  <input
                    ref={imagesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleNewImages}
                  />
                  {errorBlog.gallery.length > 0 && (
                    <p className={errorClass}>{errorBlog.gallery[0]}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </ContentLayout>
    </motion.div>
  );
}
