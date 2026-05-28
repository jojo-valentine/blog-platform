"use client";

import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/app/components/admin/ui/skeleton";
import { Card, CardContent } from "@/app/components/ui/card";
import { API_URL } from "@/app/lib/config";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/AuthContext";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/admin/ui/input";
import { Label } from "@/app/components/admin/ui/label";
import {
  User,
  Mail,
  Smartphone,
  Calendar,
  Shield,
  Save,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

type user = {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  profile: {
    age: string;
    display_name: string;
    avatar: string;
  };
  roles: string[];
};

type formUserError = {
  name: string;
  email: string;
  mobile: string;
  profile: {
    age: string;
    display_name: string;
    avatar: string;
  };
};
const initialUser: user = {
  _id: "",
  name: "",
  email: "",
  mobile: "",
  profile: {
    age: "",
    display_name: "",
    avatar: "",
  },
  roles: [],
};
const initialFormUserError: formUserError = {
  name: "",
  email: "",
  mobile: "",
  profile: {
    age: "",
    display_name: "",
    avatar: "",
  },
};
const inputErrorClass =
  "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2";

const errorTextClass =
  "mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse";
const renderError = (error?: string) =>
  error ? (
    <div className={errorTextClass}>
      <span>⚠️</span>
      <p>{error}</p>
    </div>
  ) : null;

export default function PageAdminProfileSetting() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { user: userAuth, loading: loadingAuth } = useAuth();
  const [user, setUser] = useState<user>(initialUser);
  const [formUserError, setFormUserError] =
    useState<formUserError>(initialFormUserError);
  const [avatar, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [loadingUpdateProfile, setLoadingUpdateProfile] = useState(false);
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/user/account`, {
        withCredentials: true,
      });
      setUser(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);
  const handleFormUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    if (["display_name", "age"].includes(id)) {
      setUser((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [id]: value,
        },
      }));

      setFormUserError((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [id]: "",
        },
      }));

      return;
    }

    setUser((prev) => ({
      ...prev,
      [id]: value,
    }));

    setFormUserError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };
  const handleChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarLoading(true);
    try {
      const file = e.target.files?.[0];

      if (!file) {
        setAvatarLoading(false);
        return;
      }

      // reset error
      setFormUserError((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: "",
        },
      }));

      // validate type
      if (!file.type.startsWith("image/")) {
        setFormUserError((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatar: "Only image files allowed",
          },
        }));

        e.target.value = "";
        setAvatarFile(null);
        setPreviewAvatar("");
        setAvatarLoading(false);

        return;
      }

      // validate size
      if (file.size > 2 * 1024 * 1024) {
        setFormUserError((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatar: "Max 2MB allowed",
          },
        }));

        e.target.value = "";
        setAvatarFile(null);
        setPreviewAvatar("");
        setAvatarLoading(false);

        return;
      }

      // clear old preview
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }

      // save file
      setAvatarFile(file);

      // create preview
      const previewUrl = URL.createObjectURL(file);

      setPreviewAvatar(previewUrl);
    } finally {
      setTimeout(() => {
        setAvatarLoading(false);
      }, 400);
    }
  };
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUpdateProfile(true);
    try {
      setFormUserError(initialFormUserError);

      const formData = new FormData();

      if (avatar) {
        formData.append("avatar", avatar);
      }

      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("mobile", user.mobile);
      formData.append("display_name", user.profile.display_name);
      formData.append("age", user.profile.age);

      const res = await axios.patch(
        `${API_URL}/api/admin/user/${user._id}/account`,
        formData,
        {
          withCredentials: true,
        },
      );

      setUser(res.data.data);

      setAvatarFile(null);
      setPreviewAvatar("");
      setTimeout(() => {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }, 150);
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormUserError);

        err.errors.forEach((e: { field: string; message: string }) => {
          if (["age", "display_name", "avatar"].includes(e.field)) {
            fieldErrors.profile[e.field as keyof typeof fieldErrors.profile] =
              e.message;
          } else {
            (fieldErrors as any)[e.field] = e.message;
          }
        });

        setFormUserError(fieldErrors);

        return;
      }

      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err?.message || "Something went wrong",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            container: "z-[999999]",
          },
        });
      }, 150);
    } finally {
      setLoadingUpdateProfile(false);
    }
  };
  useEffect(() => {
    return () => {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  useEffect(() => {
    // รอ auth โหลดก่อน
    if (!loadingAuth && !user) {
      router.push("/");
      return;
    }
    fetchData();
  }, [fetchData, loadingAuth, userAuth]);

  return (
    <ContentLayout title="Admin Setting">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Admin Profile Setting
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage your admin account profile and information
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-8">
                {/* Avatar Skeleton */}
                <div className="flex items-center gap-5">
                  <Skeleton className="h-28 w-28 rounded-full" />

                  <div className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                  </div>
                </div>

                {/* Input Skeleton */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
              </div>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmitUser}>
                {/* Avatar */}
                <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/20 p-6 md:flex-row">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    <AvatarImage
                      src={
                        previewAvatar
                          ? previewAvatar
                          : user.profile.avatar
                            ? user.profile.avatar.startsWith("http")
                              ? user.profile.avatar
                              : `${API_URL}${user.profile.avatar}`
                            : "/default/fallback/default-placeholder.png"
                      }
                    />

                    <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">
                      {(user.profile.display_name || user.name || "U")
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
                      htmlFor="avatar-upload-edit"
                      className=" inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
                    >
                      {avatarLoading ? (
                        <div className="flex items-center gap-2">
                          {" "}
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          <span> Processing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span>Upload Avatar</span>
                        </div>
                      )}
                    </label>

                    <input
                      id="avatar-upload-edit"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleChangeAvatar}
                      disabled={avatarLoading}
                    />

                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  {renderError(formUserError.profile.avatar)}
                </div>

                {/* User Info */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={user.name}
                        id="name"
                        className={`pl-10 ${
                          formUserError.name ? inputErrorClass : ""
                        }`}
                        onChange={handleFormUser}
                      />
                    </div>
                    {renderError(formUserError.name)}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label>Display Name</Label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        value={user.profile.display_name}
                        id="display_name"
                        className={`pl-10 ${
                          formUserError.profile.display_name
                            ? inputErrorClass
                            : ""
                        }`}
                        onChange={handleFormUser}
                      />
                    </div>
                    {renderError(formUserError.profile.display_name)}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Email</Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        className={`pl-10 ${
                          formUserError.email ? inputErrorClass : ""
                        }`}
                        onChange={handleFormUser}
                      />
                    </div>
                    {renderError(formUserError.email)}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={user.mobile}
                        id="mobile"
                        className={`pl-10 ${
                          formUserError.mobile ? inputErrorClass : ""
                        }`}
                        onChange={handleFormUser}
                      />
                    </div>
                    {renderError(formUserError.mobile)}
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <Label>Age</Label>

                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        value={user.profile.age}
                        id="age"
                        className={`pl-10 ${
                          formUserError.profile.age ? inputErrorClass : ""
                        }`}
                        onChange={handleFormUser}
                      />
                    </div>
                    {renderError(formUserError.profile.age)}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label>Role</Label>

                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        disabled
                        value={user.roles.join(", ")}
                        className="pl-10 capitalize"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end border-t pt-6">
                  <Button type="submit" disabled={loadingUpdateProfile}>
                    {loadingUpdateProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        update...
                      </>
                    ) : (
                      <>
                        {" "}
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </ContentLayout>
  );
}
