"use client";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/app/lib/config";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/AuthContext";
import {
  Plus,
  SquarePen,
  Loader2,
  Ban,
  Trash2,
  RotateCcw,
  User,
  Calendar,
  Smartphone,
  Mail,
  EyeOff,
  Eye,
  Lock,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/admin/ui/label";
import { Input } from "@/app/components/admin/ui/input";
import { PaginationTable } from "@/app/components/admin/ui/pagination_custom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/app/components/admin/ui/dialog";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/admin/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/admin/ui/card";
import { CardDescription } from "@/app/components/ui/card";
type ErrorsImage = {
  avatar?: string;
};
type formEdit = {
  _id: string;
  name: string;
  mobile: string;

  profile: {
    display_name?: string;
    avatar?: string;
    age?: string;
    social_links?: {
      platform?: string;
      url?: string;
    }[];
  };
};
type formEditError = {
  _id: string;
  name: string;
  mobile: string;

  profile: {
    display_name?: string;
    avatar?: string;
    age?: string;
    social_links?: {
      platform?: string;
      url?: string;
    }[];
  };
};
const initialFormEdit: formEdit = {
  _id: "",
  name: "",
  mobile: "",

  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};
const initialFormEditError: formEditError = {
  _id: "",
  name: "",
  mobile: "",

  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};
type formCreate = {
  name: string;
  mobile: string;
  email: string;
  password: string;
  confirm_password: string;
  profile: {
    display_name?: string;
    avatar?: string;
    age?: string;
    social_links?: {
      platform?: string;
      url?: string;
    }[];
  };
};
type formCreateError = {
  name: string;
  mobile: string;
  email: string;
  password: string;
  confirm_password: string;
  profile: {
    display_name?: string;
    avatar?: string;
    age?: string;
    social_links?: SocialLinkError[];
  };
};
export type SocialLinkError = {
  platform?: string;
  url?: string;
};

const initialFormCreate: formCreate = {
  name: "",
  mobile: "",
  email: "",
  password: "",
  confirm_password: "",
  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};
const initialFormCreateError: formCreateError = {
  name: "",
  mobile: "",
  email: "",
  password: "",
  confirm_password: "",
  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};
export default function PageUser() {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dialogUserEdit, setDialogUserEdit] = useState(false);
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState<formEdit>(initialFormEdit);
  const [formEditLoading, setFormEditLoading] = useState(false);
  const [formEditError, setFromEditError] =
    useState<formEditError>(initialFormEditError);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorImage, setErrorImage] = useState<ErrorsImage>({});
  const [dialogUserCreate, setDialogUserCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<formCreate>(initialFormCreate);
  const [formCreateLoading, setFormCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formCreateError, setFromCreateError] = useState<formCreateError>(
    initialFormCreateError,
  );
  // const [loadingAvatar ,setLoadingAvatar] = useState
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const fetchDataUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      setUsers(res.data.data);

      setTotalPages(res.data.meta.totalPages);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [page, debouncedSearch]);
  const handleEdit = async (id: string) => {
    setDialogUserEdit(true);

    const data = users.find((u) => u._id === id);

    if (!data) return;

    setFormEdit({
      _id: data._id,
      name: data.name ?? "",
      mobile: data.mobile ?? "",

      profile: {
        display_name: data.profile?.display_name ?? "",
        avatar: data.profile?.avatar ?? "",
        age: data.profile?.age ?? "",
        social_links: data.profile?.social_links ?? [],
      },
    });
  };
  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;
    if (uploadingAvatar) return; // กันกดรัว
    setUploadingAvatar(true);
    setErrorImage({});

    // ✅ validate type
    if (!file.type.startsWith("image/")) {
      setErrorImage({ avatar: "Only image files allowed" });
      setUploadingAvatar(false);
      return;
    }

    // ✅ validate size
    if (file.size > 2 * 1024 * 1024) {
      setErrorImage({ avatar: "Max 2MB allowed" });
      setUploadingAvatar(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.post(
        `${API_URL}/api/admin/users/${id}/avatar`,
        formData,
        { withCredentials: true },
      );
      setFormEdit((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: res.data.avatarUrl,
        },
      }));
      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? {
                ...user,
                profile: {
                  ...user.profile,
                  avatar: res.data.avatarUrl,
                },
              }
            : user,
        ),
      );

      Swal.fire({
        title: "success 🎉",
        text: "Role has been create success.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrorsImage: ErrorsImage = {};
        err.errors.forEach(
          (e: { field: keyof ErrorsImage; message: string }) => {
            fieldErrorsImage[e.field] = e.message;
          },
        );

        setErrorImage(fieldErrorsImage);
      } else {
        setErrorImage({
          avatar: err?.message || "Upload failed",
        });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangeEdit = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, name, value } = e.target;

    if (["display_name", "age"].includes(id)) {
      setFormEdit((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [id]: value,
        },
      }));
    } else {
      setFormEdit((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
    setFromEditError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormEditLoading(true);
    setFromEditError(initialFormEditError);
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/users/${formEdit._id}`,
        formEdit,
        { withCredentials: true },
      );
      setFormEdit((prev) => ({
        ...prev,
        mobile: res.data.data.mobile,
        name: res.data.data.name,
        profile: {
          ...prev.profile, // เก็บ avatar ไว้
          age: res.data.data.profile?.age ?? "",
          display_name: res.data.data.profile?.display_name ?? "",
          social_links: res.data.data.profile?.social_links ?? [],
        },
      }));

      setUsers((prev) =>
        prev.map((user) =>
          user._id === formEdit._id
            ? {
                ...user,
                mobile: res.data.data.mobile,
                name: res.data.data.name,
                profile: {
                  ...user.profile,
                  age: res.data.data.profile?.age ?? "",
                  display_name: res.data.data.profile?.display_name ?? "",
                  social_links: res.data.data.profile?.social_links ?? [],
                  avatar: user.profile ? (user.profile.avatar ?? "") : "", // เก็บ avatar เดิมไว้
                },
              }
            : user,
        ),
      );

      Swal.fire({
        title: "Success",
        text: "User updated successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,

        customClass: {
          container: "z-[999999]",
        },
      });
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err?.errors)) {
        const fieldErrorsProfile = structuredClone(initialFormEditError);
        err.errors.forEach(
          (e: { field: keyof formEditError; message: string }) => {
            if (e.field.startsWith("social_links")) {
              const [, indexStr, key] = e.field.split(".");
              const index = Number(indexStr);
              if (isNaN(index)) return;
              // ✅ เช็ค undefined ก่อน
              if (!fieldErrorsProfile.profile) {
                fieldErrorsProfile.profile = { social_links: [] };
              }

              if (!fieldErrorsProfile.profile.social_links) {
                fieldErrorsProfile.profile.social_links = [];
              }

              if (!fieldErrorsProfile.profile.social_links[index]) {
                fieldErrorsProfile.profile.social_links[index] = {};
              }

              (fieldErrorsProfile.profile.social_links[index] as any)[key] =
                e.message;
            } else if (
              e.field.startsWith("display_name") ||
              e.field.startsWith("age")
            ) {
              fieldErrorsProfile.profile ??= {};
              (fieldErrorsProfile.profile as any)[e.field] = e.message;
            } else {
              fieldErrorsProfile[e.field] = e.message;
            }
          },
        );
        setFromEditError(fieldErrorsProfile);
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
      setFormEditLoading(false);
    }
  };
  const handleCreate = async () => {
    setDialogUserCreate(true);
    setFromCreateError(initialFormCreateError);
  };

  const handleChangeCreate = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, name, value } = e.target;
    if (["display_name", "age"].includes(id)) {
      setFormCreate((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [id]: value,
        },
      }));
    } else {
      setFormCreate((prev) => ({
        ...prev,
        [id]: value,
      }));
    }

    setFromCreateError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (user) {
      fetchDataUsers();
    }
  }, [user, fetchDataUsers, page, debouncedSearch]);

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "/default/fallback/default-placeholder.png";
    if (avatar.startsWith("http")) return avatar;
    // ✅ เติม / ถ้าไม่มี
    const path = avatar.startsWith("/") ? avatar : `/${avatar}`;
    // console.log({ avatar: `${API_URL}${path}` });
    return `${API_URL}${path}`;
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ เก็บไฟล์ไว้ใน state
    setAvatarFile(file);

    // ✅ สร้าง URL สำหรับ preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewAvatar(previewUrl);
  };

  const addSocialLink = (
    setFormEdit: React.Dispatch<React.SetStateAction<typeof formEdit>>,
  ) => {
    setFormEdit((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        social_links: [
          ...(prev.profile.social_links ?? []), // fallback เป็น [] เสมอ
          { platform: "", url: "" },
        ],
      },
    }));
  };

  const addSocialLinkCreate = (
    setFormCreate: React.Dispatch<React.SetStateAction<typeof formCreate>>,
  ) => {
    setFormCreate((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        social_links: [
          ...(prev.profile.social_links ?? []),
          { platform: "", url: "" },
        ],
      },
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormCreateLoading(true);

    try {
      const formData = new FormData();

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // basic
      formData.append("name", formCreate.name);
      formData.append("email", formCreate.email);
      formData.append("mobile", formCreate.mobile);

      // password check
      if (formCreate.password !== formCreate.confirm_password) {
        setFromCreateError((prev) => ({
          ...prev,
          password: "Password not match",
          confirm_password: "Password not match",
        }));

        return;
      }

      formData.append("password", formCreate.password);
      formData.append("confirm_password", formCreate.confirm_password);

      // profile
      formData.append(
        "display_name",
        formCreate.profile.display_name || formCreate.name,
      );

      formData.append("age", formCreate.profile.age || "");

      formData.append(
        "social_links",
        JSON.stringify(formCreate.profile.social_links || []),
      );

      const res = await axios.post(`${API_URL}/api/admin/users`, formData, {
        withCredentials: true,
      });

      // ✅ ปิด dialog ก่อน
      setDialogUserCreate(false);

      // ✅ reset form
      setFormCreate(initialFormCreate);
      setPreviewAvatar("");
      setAvatarFile(null);

      // ✅ delay นิดนึงให้ dialog unmount
      // setTimeout(() => {
      //   Swal.fire({
      //     icon: "success",
      //     title: "Success",
      //     text: res.data.message,
      //     timer: 500,
      //     showConfirmButton: false,
      //   });
      // }, 150);
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormCreateError);

        err.errors.forEach((e: any) => {
          if (e.field.startsWith("social_links")) {
            const [, indexStr, key] = e.field.split(".");
            const index = Number(indexStr);

            if (!(fieldErrors.profile.social_links ?? [])[index]) {
              (fieldErrors.profile.social_links ?? [])[index] = {};
            }

            ((fieldErrors.profile.social_links ?? [])[index] as any)[key] =
              e.message;

            return;
          }

          if (
            e.field === "display_name" ||
            e.field === "age" ||
            e.field === "avatar"
          ) {
            (fieldErrors.profile as any)[e.field] = e.message;

            return;
          }

          (fieldErrors as any)[e.field] = e.message;
        });

        setFromCreateError(fieldErrors);
      } else {
        setTimeout(() => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.message || "Something went wrong",
          });
        }, 100);
      }
    } finally {
      setFormCreateLoading(false);
    }
  };
  return (
    <ContentLayout title="pageUser">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 space-y-4">
            {/* Header */}
            <div className="w-full rounded-2xl border bg-background p-5 shadow-sm">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Roles
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Manage roles and permissions
                  </p>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Search</Label>

                  <input
                    type="text"
                    placeholder="Search roles..."
                    // value={search}
                    // onChange={(e) => handleSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-[320px]"
                  />
                </div>

                {/* Bottom */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  {/* Button */}
                  <Button
                    variant="outline"
                    type="button"
                    className="h-11 rounded-xl bg-green-500 px-5 text-white transition hover:bg-green-600"
                    onClick={handleCreate}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative overflow-x-auto rounded-base border border-default bg-neutral-primary-soft shadow-xs">
              <table className="w-full text-left text-sm text-body">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <TableSkeleton length={6} colSpan={4} />
                  ) : users.length > 0 ? (
                    users.map((u, i) => (
                      <tr
                        key={u._id || i}
                        className="border-b border-border/50 transition hover:bg-muted/30"
                      >
                        {/* User */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <Avatar
                              className="h-12 w-12 border cursor-pointer transition hover:scale-105"
                              onClick={() => {
                                if (!u?.profile?.avatar) return;

                                setSelectedImage(
                                  u.profile.avatar.startsWith("http")
                                    ? u.profile.avatar
                                    : `${API_URL}${u.profile.avatar}`,
                                );
                              }}
                            >
                              {u?.profile?.avatar ? (
                                <AvatarImage
                                  src={getAvatarSrc(u?.profile?.avatar)}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/default/fallback/default-placeholder.png";
                                  }}
                                />
                              ) : null}

                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {(displayName || u?.name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {u.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>

                              {u.mobile && (
                                <p className="text-xs text-muted-foreground">
                                  {u.mobile}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Profile */}
                        <td className="px-4 py-4 align-top">
                          {u.profile ? (
                            <div className="space-y-3">
                              {/* Display Name */}
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                  {u.profile.display_name}
                                </span>

                                {u.profile.age && (
                                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                    {u.profile.age} years
                                  </span>
                                )}
                              </div>

                              {/* Social Links */}
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Social Links
                                </p>

                                {u.profile.social_links?.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {u.profile.social_links.map(
                                      (link: any, idx: number) => (
                                        <a
                                          key={link._id || idx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-500 hover:underline break-all"
                                        >
                                          {link.platform}: {link.url}
                                        </a>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    No social links
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
                              No profile
                            </div>
                          )}
                        </td>
                        {/* Suspend Status */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center">
                            {u.suspended ? (
                              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                                Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="hover:bg-muted"
                              onClick={() => handleEdit(u._id)}
                              type="button"
                            >
                              <SquarePen className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="outline"
                              className={
                                u.suspended
                                  ? "border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                              }
                              // onClick={() =>
                              //   handleSuspendUser(u._id, u.suspended)
                              // }
                            >
                              {u.suspended ? (
                                <RotateCcw className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-muted-foreground"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            </div>
          </div>
        </motion.div>
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
      {dialogUserEdit && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {dialogUserEdit && (
            <Dialog open={dialogUserEdit} onOpenChange={setDialogUserEdit}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl">
                      Edit User Profile
                    </DialogTitle>

                    <DialogDescription>
                      Update user profile information and social links.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleEditSubmit} className="mt-6 space-y-8">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/20 p-6 md:flex-row">
                      <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                        {formEdit.profile.avatar ? (
                          <AvatarImage
                            src={
                              formEdit.profile.avatar?.startsWith("http")
                                ? formEdit.profile.avatar
                                : `${API_URL}${formEdit.profile.avatar}`
                            }
                            onError={(e) => {
                              e.currentTarget.src =
                                "/default/fallback/default-placeholder.png";
                            }}
                          />
                        ) : null}

                        <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">
                          {(displayName || formEdit.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">Profile Avatar</h3>

                          <p className="text-sm text-muted-foreground">
                            Upload avatar image for this user
                          </p>
                        </div>

                        <label
                          htmlFor="avatar-upload"
                          className=" inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
                        >
                          {uploadingAvatar ? (
                            <div className="flex items-center gap-2">
                              {" "}
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              <span> uploading</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              <span>Upload Avatar</span>
                            </div>
                          )}
                        </label>

                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            handleAvatarUpload(e, formEdit._id);
                          }}
                          disabled={uploadingAvatar}
                        />

                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      {errorImage.avatar && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
                          <span>⚠️</span>
                          <p>{errorImage.avatar}</p>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>

                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="name"
                            value={formEdit.name}
                            placeholder="Enter your name"
                            className={`pl-10 ${
                              formEditError.name
                                ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                : ""
                            }`}
                            onChange={handleChangeEdit}
                          />
                          {formEditError.name && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
                              <span>⚠️</span>
                              <p>{formEditError.name}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Name */}
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>

                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="display_name"
                            value={formEdit.profile.display_name}
                            placeholder="Display name"
                            className={`pl-10 ${
                              formEditError.profile.display_name
                                ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                : ""
                            }`}
                            onChange={handleChangeEdit}
                          />
                          {formEditError.profile.display_name && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
                              <span>⚠️</span>
                              <p>{formEditError.profile.display_name}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Age */}
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>

                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="age"
                            type="number"
                            value={formEdit.profile.age}
                            placeholder="Age"
                            className={`pl-10 ${
                              formEditError.profile.age
                                ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                : ""
                            }`}
                            onChange={handleChangeEdit}
                          />
                          {formEditError.profile.age && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
                              <span>⚠️</span>
                              <p>{formEditError.profile.age}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>

                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="mobile"
                            value={formEdit.mobile}
                            placeholder="Mobile"
                            className={`pl-10 ${
                              formEditError.mobile
                                ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                : ""
                            }`}
                            onChange={handleChangeEdit}
                          />
                          {formEditError.mobile && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
                              <span>⚠️</span>
                              <p>{formEditError.mobile}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Social Links</h3>

                          <p className="text-sm text-muted-foreground">
                            Add social accounts
                          </p>
                        </div>
                        {(formEdit?.profile?.social_links?.length ?? 0) < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSocialLink(setFormEdit)}
                          >
                            + Add Link
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {formEdit.profile.social_links?.map((link, index) => (
                          <div
                            key={index}
                            className=" flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row "
                          >
                            <select
                              value={link.platform}
                              className=" rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                              onChange={(e) => {
                                const newLinks = [
                                  ...(formEdit?.profile?.social_links ?? []),
                                ];
                                newLinks[index].platform = e.target.value;
                                // setSocial_links(newLinks);
                                setFormEdit((prev) => ({
                                  ...prev,
                                  profile: {
                                    ...prev.profile,
                                    social_links: newLinks,
                                  },
                                }));
                              }}
                            >
                              <option value="">Select Platform</option>

                              <option value="youtube">YouTube</option>

                              <option value="instagram">Instagram</option>

                              <option value="facebook">Facebook</option>

                              <option value="other">Other</option>
                            </select>

                            <Input
                              type="text"
                              value={link.url}
                              placeholder="https://..."
                              // className="flex-1"
                              className={`pl-10 ${
                                formEditError.profile?.social_links?.[index]
                                  ?.url
                                  ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                  : ""
                              } basis-8/12 border p-2 rounded`}
                              onChange={(e) => {
                                const newLinks = [
                                  ...(formEdit?.profile?.social_links ?? []),
                                ];
                                newLinks[index].url = e.target.value;
                                setFormEdit((prev) => ({
                                  ...prev,
                                  profile: {
                                    ...prev.profile,
                                    social_links: newLinks,
                                  },
                                }));
                              }}
                            />

                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setFormEdit((prev) => ({
                                  ...prev,
                                  profile: {
                                    ...prev.profile,
                                    social_links:
                                      prev.profile?.social_links?.filter(
                                        (_, i) => i !== index,
                                      ),
                                  },
                                }));
                              }}
                            >
                              ลบ
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogUserEdit(false)}
                      >
                        Cancel
                      </Button>

                      <Button type="submit" disabled={formEditLoading}>
                        {formEditLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <p> Save Changes</p>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      )}

      {dialogUserCreate && (
        <Dialog
          open={dialogUserCreate}
          onOpenChange={(open) => {
            setDialogUserCreate(open);

            if (!open) {
              setPreviewAvatar("");
              setAvatarFile(null);

              setFormCreate(initialFormCreate);
              setFromCreateError(initialFormCreateError);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-bold">
                  Create User Profile
                </DialogTitle>

                <DialogDescription>
                  Create user profile information and social links
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-8">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/20 p-6 md:flex-row">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    {previewAvatar ? (
                      <AvatarImage
                        src={previewAvatar}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default/fallback/default-placeholder.png";
                        }}
                      />
                    ) : null}

                    <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">
                      {(
                        formCreate.profile.display_name ||
                        formCreate.name ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Profile Avatar</h3>

                      <p className="text-sm text-muted-foreground">
                        Upload avatar image for this user
                      </p>
                    </div>

                    <label
                      htmlFor="avatar-upload-create"
                      className="
                  inline-flex cursor-pointer items-center gap-2
                  rounded-lg border border-border
                  bg-background px-4 py-2 text-sm
                  font-medium shadow-sm transition
                  hover:bg-muted
                "
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Upload Avatar</span>
                        </>
                      )}
                    </label>

                    <input
                      id="avatar-upload-create"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatar}
                    />

                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>

                    {formCreateError.profile.avatar && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <span>⚠️</span>
                        <p>{formCreateError.profile.avatar}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="name"
                        value={formCreate.name}
                        placeholder="Enter your name"
                        className={`pl-10 ${
                          formCreateError.name
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />
                    </div>

                    {formCreateError.name && (
                      <p className="text-sm text-red-500">
                        {formCreateError.name}
                      </p>
                    )}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="display_name"
                        value={formCreate.profile.display_name}
                        placeholder="Display name"
                        className={`pl-10 ${
                          formCreateError.profile.display_name
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />
                    </div>

                    {formCreateError.profile.display_name && (
                      <p className="text-sm text-red-500">
                        {formCreateError.profile.display_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="email"
                        type="email"
                        value={formCreate.email}
                        placeholder="Email"
                        className={`pl-10 ${
                          formCreateError.email
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />
                    </div>

                    {formCreateError.email && (
                      <p className="text-sm text-red-500">
                        {formCreateError.email}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>

                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="age"
                        type="number"
                        value={formCreate.profile.age}
                        placeholder="Age"
                        className={`pl-10 ${
                          formCreateError.profile.age
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />
                    </div>

                    {formCreateError.profile.age && (
                      <p className="text-sm text-red-500">
                        {formCreateError.profile.age}
                      </p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mobile">Mobile</Label>

                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="mobile"
                        value={formCreate.mobile}
                        placeholder="Mobile"
                        className={`pl-10 ${
                          formCreateError.mobile
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />
                    </div>

                    {formCreateError.mobile && (
                      <p className="text-sm text-red-500">
                        {formCreateError.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Social Links</h3>

                      <p className="text-sm text-muted-foreground">
                        Add social accounts
                      </p>
                    </div>

                    {(formCreate.profile.social_links?.length ?? 0) < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSocialLinkCreate(setFormCreate)}
                      >
                        + Add Link
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {formCreate.profile.social_links?.map((link, index) => (
                      <div
                        key={index}
                        className="
                      flex flex-col gap-3 rounded-xl border
                      bg-background p-4 md:flex-row
                    "
                      >
                        <select
                          value={link.platform}
                          className="
                        rounded-lg border border-border
                        bg-background px-3 py-2 text-sm
                      "
                          onChange={(e) => {
                            const newLinks = [
                              ...(formCreate.profile.social_links ?? []),
                            ];

                            newLinks[index].platform = e.target.value;

                            setFormCreate((prev) => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                social_links: newLinks,
                              },
                            }));
                          }}
                        >
                          <option value="">Select Platform</option>

                          <option value="youtube">YouTube</option>

                          <option value="instagram">Instagram</option>

                          <option value="facebook">Facebook</option>

                          <option value="other">Other</option>
                        </select>

                        <Input
                          type="text"
                          value={link.url}
                          placeholder="https://..."
                          className={`flex-1 ${
                            formCreateError.profile?.social_links?.[index]?.url
                              ? "border-red-500 ring-1 ring-red-500"
                              : ""
                          }`}
                          onChange={(e) => {
                            const newLinks = [
                              ...(formCreate.profile.social_links ?? []),
                            ];

                            newLinks[index].url = e.target.value;

                            setFormCreate((prev) => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                social_links: newLinks,
                              },
                            }));
                          }}
                        />
                        {formCreateError.profile.social_links?.[index]?.url && (
                          <p className="mt-1 text-sm text-red-500">
                            {formCreateError.profile.social_links[index]?.url}
                          </p>
                        )}

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setFormCreate((prev) => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                social_links: (
                                  prev.profile.social_links ?? []
                                ).filter((_, i) => i !== index),
                              },
                            }));
                          }}
                        >
                          ลบ
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formCreate.password}
                        placeholder="Password"
                        className={`pl-10 ${
                          formCreateError.password
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {formCreateError.password && (
                      <p className="text-sm text-red-500">
                        {formCreateError.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="confirm_password"
                        type={showPasswordConfirm ? "text" : "password"}
                        value={formCreate.confirm_password}
                        placeholder="Confirm Password"
                        className={`pl-10 ${
                          formCreateError.confirm_password
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                        onChange={handleChangeCreate}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordConfirm(!showPasswordConfirm)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {formCreateError.confirm_password && (
                    <p className="text-sm text-red-500">
                      {formCreateError.confirm_password}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogUserCreate(false)}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={formCreateLoading}>
                    {formCreateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </ContentLayout>
  );
}
