"use client";
import { TextareaHTMLAttributes, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { Plus, Calendar, ImagePlus, X, Save } from "lucide-react";
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
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { useRouter } from "next/navigation";

type Blog = {
  mainImage: File | null;
  title: string;
  categories: string[];
  content: string;
  coverImage: { file: File; preview: string }[];
};

type errorBlog = {
  mainImage: File | null;
  title: string;
  categories: string[];
  content: string;
  coverImage: { file: File; preview: string }[];
};

const initialBlog: Blog = {
  mainImage: null,
  title: "",
  categories: [] as string[],
  content: "",
  coverImage: [],
};

const initialBlogError: errorBlog = {
  mainImage: null,
  title: "",
  categories: [] as string[],
  content: "",
  coverImage: [],
};

type Category = {
  _id: string;
  name: string;
};
export default function Page() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const mainImageRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorBlog, setErrorBlog] = useState<errorBlog>(initialBlogError);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  // const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  // const [additionalImages, setAdditionalImages] = useState<
  //   { file: File; preview: string }[]
  // >([]);

  const [blogForm, setBlogForm] = useState<Blog>(initialBlog);
  const fetchCategory = async () => {
    setLoadingCategory(true);
    try {
      const res = await axios.get(`${API_URL}/api/category/image-category`, {
        withCredentials: true,
      });
      // console.log(res.data.data);

      const data = res.data;
      setCategories(data.data); // หรือ res.data.data แล้วแต่ API
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
      fetchCategory(); // 🔥 เรียกเพิ่มตรงนี้
    }
  }, [user, loadingAuth]);
  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBlogForm((prev) => ({
      ...prev,
      mainImage: file,
    }));
    // setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };
  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setBlogForm((prev) => ({
      ...prev,
      coverImage: [...prev.coverImage, ...newImages],
    }));
    // setAdditionalImages((prev) => [...prev, ...newImages]);
  };

  const removeAdditionalImage = (index: number) => {
    // setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setBlogForm((prev) => ({
      ...prev,
      coverImage: prev.coverImage.filter((_, i) => i !== index),
    }));
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value, type } = e.target;
    if (type === "checkbox") {
      setBlogForm((prev) => {
        const exists = prev.categories.includes(value);

        return {
          ...prev,
          categories: exists
            ? prev.categories.filter((v) => v !== value)
            : [...prev.categories, value],
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
  // const uploadImage = async (file: File, path: string) => {
  //   const { error } = await supabase.storage
  //     .from("blog-images")
  //     .upload(path, file, { upsert: true });
  //   if (error) throw error;
  //   return supabase.storage.from("blog-images").getPublicUrl(path).data
  //     .publicUrl;
  // };
  if (loading) return <p>Loading...</p>;

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
            <Link href="/pages/blog/">
              <Plus className="mr-1.5 h-4 w-4" /> back
            </Link>
          </Button>
        </div>
        <div className="container max-w-3xl py-10 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold mb-8">
            Create Blog Post
          </h1>
          <form
          //   onSubmit={}
          >
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
                        // setMainImageFile(null);
                        setBlogForm((prev) => ({
                          ...prev,
                          mainImage: null,
                        }));
                      }}
                      className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background hover:bg-foreground transition-colors"
                    >
                      <X className="h-4 w-4 cursor-pointer" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainImageRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">Click to upload main image</span>
                  </button>
                )}
                <input
                  ref={mainImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden cursor-pointer"
                  onChange={handleMainImage}
                />
              </CardContent>
            </Card>

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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your blog content..."
                    value={blogForm.content}
                    onChange={handleChange}
                    rows={12}
                    required
                  />
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
                          checked={blogForm.categories.includes(cat._id)} // 👈 sync state
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
                  {blogForm.coverImage.map((img, i) => (
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
                  <button
                    type="button"
                    onClick={() => imagesRef.current?.click()}
                    className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
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
                  onChange={handleAdditionalImages}
                />
              </CardContent>
            </Card>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Blog Post"}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
