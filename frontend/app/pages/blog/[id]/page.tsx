"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowBigLeft, ImagePlus, X, Save, ArrowLeft } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Link from "next/link";
const QuillEditor = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

type ImageItem = {
  file: File;
  preview: string;
};
type Gallery = {
  _id: string;
  path: string;
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  tags_id: Category[]; // ✅ แก้ตรงนี้
  cover_image: string[];
  // createdAt: string;
  gallery: Gallery[];
};
type Category = {
  _id: string;
  name: string;
};

type errorBlog = {
  cover_image: string; // error message ของ main_image
  title: string; // error message ของ title
  categories: string; // error message ของ categories
  content: string; // error message ของ content
  gallery: string[]; // error message ของ gallery
};

const initialBlog: Blog = {
  _id: "",
  title: "",
  content: "",
  tags_id: [],
  cover_image: [],
  gallery: [],
};

const initialBlogError: errorBlog = {
  cover_image: "",
  title: "",
  categories: "",
  content: "",
  gallery: [],
};

const MAX_IMAGES = 5; // จำนวนสูงสุดที่อนุญาต
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]; // ประเภทไฟล์ที่อนุญาต
const MAX_SIZE = 5 * 1024 * 1024;
export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, loading: loadingAuth } = useAuth();
  const [blogForm, setBlogForm] = useState<Blog>(initialBlog);
  const [errorBlog, setErrorBlog] = useState<errorBlog>(initialBlogError);
  const [blogFromUpdate, setBlogFromUpdate] = useState<null>(null);
  const [blogFromUpdateLoading, setBlogFromUpdateLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]); // list ทั้งหมด
  const { id: id } = useParams<{ id: string }>();

  const mainImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [newGallery, setNewGallery] = useState<ImageItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const fetchBlogEdit = useCallback(async () => {
    try {
      if (!id) return; // guard

      const res = await axios.get(`${API_URL}/api/blog/${id}/edit`, {
        withCredentials: true,
      });
      const data = res.data;
      setBlogForm({
        ...data.data,
        title: data.data.title || "",
        tags_id: data.data.tags_id || [],
        cover_image: data.data.cover_image || [],
        gallery: (data.data.images || []).map(
          (img: { _id: string; path: string }) => ({
            _id: img._id,
            path: `${API_URL}${img.path}`,
          }),
        ),

        content: data.data.content || "",
      });

      setMainImagePreview(data.data.cover_image?.[0] || null); // ✅ เอา index 0
    } catch (error: any) {
      console.error(
        "Fetch blog edit failed:",
        error.response?.data || error.message,
      );
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || "Something went wrong",
      });
    }
  }, [id]);

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
    if (!loadingAuth && !user && !id) {
      router.push("/");
      return; // stop further execution
    }

    if (id) {
      fetchBlogEdit();
    }

    fetchCategory();
  }, [user, id, loadingAuth, router, fetchBlogEdit, fetchCategory]);

  if (loading) return <p>Loading...</p>;

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // เช็ค type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorBlog((prev) => ({
        ...prev,
        main_image: "ไฟล์ต้องเป็น JPG, PNG หรือ WEBP เท่านั้น",
      }));
      alert("ไฟล์ต้องเป็น JPG, PNG หรือ WEBP เท่านั้น");
      return;
    }
    // เช็คขนาดไฟล์
    if (file.size > MAX_SIZE) {
      setErrorBlog((prev) => ({
        ...prev,
        main_image: "ไฟล์ต้องไม่เกิน 5MB",
      }));
      alert("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setBlogForm((prev) => ({
      ...prev,
      main_image: file,
    }));

    // 🔥 เก็บรูปใหม่
    setNewImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const img = preview || blogForm.cover_image?.[0];

  const imageSrc = img
    ? img.startsWith("http") || img.startsWith("blob")
      ? img
      : `${API_URL}${img}`
    : undefined;

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewGallery((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
    ]);
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value, type } = e.target;
    if (type === "checkbox") {
      setBlogForm((prev) => {
        const exists = prev.tags_id.some((cat) => cat._id === value);
        const checked = (e.target as HTMLInputElement).checked;
        return {
          ...prev,
          tags_id: checked
            ? [...prev.tags_id, { _id: value, name: "" }] // name อาจต้องเติมจาก list category
            : prev.tags_id.filter((cat) => cat._id !== value),
        };
      });
    } else {
      setBlogForm((prev) => ({
        ...prev,
        [id]: value,
      }));
    }

    setErrorBlog((prev) => ({ ...prev, [id]: "" }));
  };
  const handleContentChange = (val: string | undefined) => {
    setBlogForm((prev) => ({ ...prev, content: val ?? "" }));
  };
  const handleUpdateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", blogForm.title);
    form.append("content", blogForm.content);
    blogForm.tags_id.forEach((tag) => {
      form.append("categories", tag._id);
    });
    if (newImage) {
      form.append("cover_image", newImage);
    }
    if (newGallery.length > 0) {
      newGallery.forEach((img) => {
        form.append("gallery", img.file);
      });
    }
    console.log([...form.entries()]);
    setBlogFromUpdateLoading(true);
    try {
      const res = await axios.patch(`${API_URL}/api/blog/${id}/update`, form, {
        withCredentials: true,
      });
      const data = res.data;
      // console.log({ data });

      Swal.fire({
        title: "Update Successfully 🎉",
        text: "Your blog has been updated.",
        icon: "success",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Go to Blog",
        cancelButtonText: "Stay Here",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/pages/blog");
        }
      });
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialBlogError);

        err.errors.forEach((e: { field: keyof errorBlog; message: string }) => {
          if (e.field.startsWith("gallery")) {
            const [, indexStr, key] = e.field.split(".");
            const index = Number(indexStr);
            if (isNaN(index)) return;

            if (!fieldErrors.gallery) {
              fieldErrors.gallery = [];
            }
            (fieldErrors.gallery[index] as any)[key] = e.message;
          } else {
            fieldErrors[e.field as Exclude<keyof errorBlog, "gallery">] =
              e.message;
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
      setBlogFromUpdateLoading(false);
    }
  };
  const handleDeleteImage = async (imageId: string) => {
    if (!imageId || deletingIds.includes(imageId)) return;
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeletingIds((prev) => [...prev, imageId]);
        const prevGallery = blogForm.gallery;

        try {
          const res = await axios.delete(
            `${API_URL}/api/blog/${imageId}/image`,
            {
              withCredentials: true,
            },
          );

          setBlogForm((prev) => ({
            ...prev,
            gallery: prev.gallery.filter((img) => img._id !== imageId),
          }));

          Swal.fire({
            title: "Deleted!",
            text: "Image deleted successfully.",
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "OK",
          });
        } catch (error) {
          setBlogForm((prev) => ({
            ...prev,
            gallery: prevGallery,
          }));

          Swal.fire({
            title: "Error",
            text: "There was a problem deleting the image.",
            icon: "error",
            confirmButtonColor: "#d33",
            confirmButtonText: "Close",
          });
        } finally {
          setDeletingIds((prev) => prev.filter((id) => id !== imageId));
        }
      }
    });
  };

  const errorClass = "text-sm text-red-500 mt-1";
  const inputErrorClass = "border-red-500 focus-visible:ring-red-500";
  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <Button asChild>
        <Link href="/pages/blog">
          <ArrowBigLeft className="mr-1.5 h-4 w-4" /> Back to My Blogs
        </Link>
      </Button>

      <h1 className="font-heading text-3xl font-bold mb-8">Edit Blog Post</h1>
      <form onSubmit={handleUpdateForm}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Main Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {imageSrc ? (
                <>
                  <img
                    src={imageSrc}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/default/fallback/default-placeholder.png";
                    }}
                  />

                  {newImage && (
                    <button
                      type="button"
                      onClick={() => {
                        // setMainImagePreview(null); // 👈 แค่นี้พอ
                        setPreview(null);
                        setNewImage(null);
                      }}
                      className={`absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background ${
                        errorBlog.cover_image ? inputErrorClass : ""
                      }`}
                    >
                      <X className="h-4 w-4 cursor-pointer" />
                    </button>
                  )}
                  {/* 🔥 ปุ่มเปลี่ยนรูป */}
                  <button
                    type="button"
                    onClick={() => mainImageRef.current?.click()}
                    className={`absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded cursor-pointer ${
                      errorBlog.cover_image ? inputErrorClass : ""
                    }`}
                  >
                    Change
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => mainImageRef.current?.click()}
                  className={`cursor-pointer w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors ${
                    errorBlog.cover_image ? inputErrorClass : ""
                  }`}
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Click to upload main image</span>
                </button>
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
        </Card>
        <Card className="mb-6">
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">content</Label>

              <QuillEditor
                value={blogForm.content}
                onChange={handleContentChange}
                theme="snow"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    // ["link", "image"],
                    ["clean"],
                  ],
                }}
                style={{ height: "300px", marginBottom: "50px" }}
                className={`${errorBlog.content} ? inputErrorClass : ""`}
              />
              {errorBlog.content && (
                <p className={errorClass}>{errorBlog.content}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail">type category</Label>
              <div className="flex flex-wrap  gap-3">
                {categories.map((cat) => {
                  const checked = blogForm.tags_id.some(
                    (c) => c._id === cat._id,
                  );

                  return (
                    <label
                      key={cat._id}
                      htmlFor={`cat-${cat._id}`}
                      className={`cursor-pointer px-3 py-2 rounded-lg border transition flex items-center gap-2
          ${
            checked
              ? "bg-primary text-white border-primary"
              : "bg-background border-muted hover:border-foreground/30"
          }`}
                    >
                      <input
                        id={`cat-${cat._id}`} // ✅ unique
                        type="checkbox"
                        value={cat._id}
                        checked={checked}
                        onChange={handleChange}
                        className="hidden" // 🔥 ซ่อน checkbox
                      />

                      {/* optional icon */}
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-xs
            ${checked ? "bg-white text-primary" : ""}
          `}
                      >
                        {checked && "✓"}
                      </span>

                      <span className="text-sm">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
              {errorBlog.categories && (
                <p className={errorClass}>{errorBlog.categories}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Additional Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {blogForm.gallery.map((img, i) => {
                // console.log(blogForm.gallery.map((i) => i._id));
                const isDeleting = deletingIds.includes(img._id);
                return (
                  <div
                    key={img._id}
                    className="relative rounded-lg overflow-hidden aspect-square"
                  >
                    <img
                      key={`${img._id}-${i}`}
                      alt=""
                      className="w-full h-full object-cover"
                      src={`${img.path}`}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/default/fallback/default-placeholder.png";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img._id)}
                      className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors cursor-pointer"
                    >
                      {isDeleting ? "..." : <X className="h-3 w-3" />}
                    </button>
                    {/* label */}
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                      old
                    </span>
                  </div>
                );
              })}

              {/* 🟢 รูปใหม่ */}

              {newGallery.map((img, i) => (
                <div
                  key={`new-${i}`}
                  className="relative rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    // setNewGallery
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
                    className="cursor-pointer absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {/* label */}
                  <span className="absolute bottom-1 left-1 text-[10px] bg-green-600 text-white px-1 rounded">
                    new
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => imagesRef.current?.click()}
                className="cursor-pointer aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
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
            {errorBlog.gallery && (
              <p className={errorClass}>{errorBlog.gallery}</p>
            )}
          </CardContent>
        </Card>
        <Button
          type="submit"
          size="lg"
          disabled={blogFromUpdateLoading}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {blogFromUpdateLoading ? "Updating..." : "Change Blog"}
        </Button>
      </form>
    </div>
  );
}
