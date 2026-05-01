"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { Plus, Calendar, ImagePlus, X, Save, ArrowLeft } from "lucide-react";
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
const QuillEditor = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

type ImageItem = {
  file: File;
  preview: string;
};
type Blog = {
  _id: string;
  title: string;
  content: string;
  tags_id: Category[]; // ✅ แก้ตรงนี้
  cover_image: string[];
  // createdAt: string;
  gallery: ImageItem[];
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

  const fetchBlogEdit = useCallback(async () => {
    try {
      if (!id) return; // guard

      const res = await axios.get(`${API_URL}/api/blog/${id}/edit`, {
        withCredentials: true,
      });
      const data = res.data;
      setBlogForm(data.data);

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
  console.log({ preview });
  // console.log("STATE:", blogForm.cover_image);
  const stripHtml = (html: string) => {
    if (typeof document === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("test");

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
  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => router.push("/pages/blog")}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to My Blogs
      </Button>
      <h1 className="font-heading text-3xl font-bold mb-8">Edit Blog Post</h1>
      <form
      // onSubmit={handleSubmit}
      >
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Main Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {imageSrc ? (
                <>
                  <img src={imageSrc} className="w-full h-64 object-cover" />

                  {newImage && (
                    <button
                      type="button"
                      onClick={() => {
                        // setMainImagePreview(null); // 👈 แค่นี้พอ
                        setPreview(null);
                        setNewImage(null);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background hover:bg-foreground transition-colors"
                    >
                      <X className="h-4 w-4 cursor-pointer" />
                    </button>
                  )}
                  {/* 🔥 ปุ่มเปลี่ยนรูป */}
                  <button
                    type="button"
                    onClick={() => mainImageRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded"
                  >
                    Change
                  </button>
                </>
              ) : (
                <button onClick={() => mainImageRef.current?.click()}>
                  Upload
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
              <Input value={blogForm.title} onChange={handleChange} required />
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
                // className={`${errorBlog.content} ? inputErrorClass : ""`}
              />
              {/* {errorBlog.content && (
                <p className={errorClass}>{errorBlog.content}</p>
              )} */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail">type category</Label>
              <div className="flex flex-wrap  gap-3">
                {categories.map((cat) => (
                  <div key={cat._id} className="">
                    <input
                      id="categories" // 👈 สำคัญ
                      type="checkbox"
                      value={cat._id} // 👈 ใช้ id แทน name
                      checked={blogForm.tags_id.some((c) => c._id === cat._id)}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor=""
                      className="select-none ms-2 text-sm font-medium text-heading"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
              {/* {errorBlog.categories && (
                <p className={errorClass}>{errorBlog.categories}</p>
              )} */}
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
              {/* {newImages.map((img, i) => ( */}
              <div
                // key={`new-${i}`}
                className="relative rounded-lg overflow-hidden aspect-square"
              >
                <img
                  // src={img.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  // onClick={() =>
                  //   setNewImages((prev) => prev.filter((_, idx) => idx !== i))
                  // }
                  className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {/* ))} */}
              <button
                type="button"
                onClick={() => imagesRef.current?.click()}
                className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Add</span>
              </button>
            </div>

            {newGallery && (
              <div>
                <h2>new images</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                        className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input
              ref={imagesRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleNewImages}
            />
          </CardContent>
        </Card>
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
