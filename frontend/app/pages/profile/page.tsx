"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  Pencil,
  PenLine,
  Mail,
  Form,
  User,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import Swal from "sweetalert2";
import { isArray } from "util";
type ErrorsImage = {
  avatar?: string;
};
type ErrorsProfile = {
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
// กำหนด type ของ profile
interface SocialLink {
  _id?: string;
  platform: string;
  url: string;
}
type Profile = {
  name: string;
  email: string;
  mobile: string;
  profile: {
    display_name: string;
    avatar?: string;
    age?: string;
    social_links?: SocialLink[];
  };
};
type ProfileFrom = {
  name: string;
  mobile: string;
  profile: {
    display_name: string;
    age?: string;
    social_links: SocialLink[];
  };
};
type Password = {
  password_old: string;
  password_new: string;
  password_confirm: string;
};

type PasswordError = {
  password_old: string[];
  password_new: string[];
  password_confirm: string[];
};

type Email = {
  email: string;
};

type EmailError = {
  email: string | string[]; // รองรับข้อความเดียวหรือหลายข้อความ
};

const initialEmail: Email = {
  email: "",
};

const initialEmailError: EmailError = {
  email: "",
};

const initialProfile = {
  name: "",
  email: "",
  mobile: "",
  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};
const initialProfileForm: ProfileFrom = {
  name: "",
  mobile: "",
  profile: {
    display_name: "",
    age: "",
    social_links: [],
  },
};
const initialPassword: Password = {
  password_old: "",
  password_new: "",
  password_confirm: "",
};
const initialPasswordError = {
  password_old: [] as string[],
  password_new: [] as string[],
  password_confirm: [] as string[],
};
const initialErrorsProfile: ErrorsProfile = {
  name: "",
  mobile: "",
  profile: {
    display_name: "",
    avatar: "",
    age: "",
    social_links: [],
  },
};

export default function () {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const avatar = user?.profile?.avatar;
  const avatarSrc =
    avatar && (avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorImage, setErrorImage] = useState<ErrorsImage>({});
  const [modelProfileEdit, setModelProfileEdit] = useState(false);
  const [modelEmailEdit, setModelEmailEdit] = useState(false);
  const [modelPasswordEdit, setModelPasswordEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileForm, setProfileForm] =
    useState<ProfileFrom>(initialProfileForm);
  const [errorsProfileForm, setErrorsProfileForm] =
    useState<ErrorsProfile>(initialErrorsProfile);
  // ใช้กับ useState
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const fetchedRef = useRef(false);
  const [newPassword, setNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
    oldPassword: false,
  });
  const togglePassword = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const [passwordError, setPasswordError] =
    useState<PasswordError>(initialPasswordError);
  const [fromNewPassword, setFromNewPassword] =
    useState<Password>(initialPassword);
  const [formEmail, setFormEmail] = useState<Email>(initialEmail);
  const [emailError, setEmailError] = useState<EmailError>(initialEmailError);
  const [changingEmail, setChangingEmail] = useState(false);
  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFromNewPassword((prev) => ({
      ...prev,
      [id]: value,
    }));

    setPasswordError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };
  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(initialEmailError);
    setChangingEmail(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/request-change-email`,
        formEmail,
        { withCredentials: true },
      );

      Swal.fire({
        title: "email updated 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // ✅ clear form หลัง update สำเร็จ
      setFormEmail(initialEmail);
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err)) {
        const fieldEmailError: EmailError = { ...initialEmailError };
        err.forEach((e: { field: keyof EmailError; message: string }) => {
          // ถ้าอยากเก็บหลายข้อความ → ใช้ array
          fieldEmailError[e.field] = Array.isArray(fieldEmailError[e.field])
            ? [...fieldEmailError[e.field], e.message]
            : [e.message];
        });
        setEmailError(fieldEmailError);
      } else {
        setEmailError({
          email: err?.message || "sending new email failed",
        });
      }
    } finally {
      setChangingEmail(false);
    }
  };
  const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormEmail((prev) => ({
      ...prev,
      [id]: value,
    }));

    setEmailError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(initialPasswordError);
    setChangingPassword(true);
    try {
      const res = await axios.patch(
        `${API_URL}/api/auth/update-password`,
        fromNewPassword,
        {
          withCredentials: true,
        },
      );
      setFromNewPassword(initialPassword);
      Swal.fire({
        title: "password updated 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err?.errors)) {
        const fieldPasswordError = structuredClone(initialPasswordError);
        err.errors.forEach((e: { field: keyof Password; message: string }) => {
          fieldPasswordError[e.field].push(e.message);
        });
        console.log(fieldPasswordError);
        setPasswordError(fieldPasswordError);
      } else {
        setPasswordError({
          password_new: [],
          password_old: [],
          password_confirm: [error.response?.data?.message || "update failed"],
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };
  const handleChangeProfile = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    if (["display_name", "age"].includes(id)) {
      setProfileForm((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [id]: value,
        },
      }));
    } else {
      setProfileForm((prev) => ({
        ...prev,
        [id]: value,
      }));
    }

    setErrorsProfileForm((prev) => ({
      ...prev,
      [id]: "",
      profile: {
        ...prev.profile,
        [id]: "",
      },
    }));
  };
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }

    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        withCredentials: true,
      });

      const data = res.data.user;
      setProfile({
        email: data.email,
        mobile: data.mobile,
        name: data.name,
        profile: {
          avatar: data.profile?.avatar ?? "",
          age: data.profile?.age ?? "",
          display_name: data.profile?.display_name ?? "",
          social_links: data.profile?.social_links ?? [],
        },
      });
      setProfileForm({
        mobile: data.mobile,
        name: data.name,
        profile: {
          age: data.profile?.age ?? "",
          display_name: data.profile?.display_name ?? "",
          social_links: data.profile?.social_links ?? [],
        },
      });
    } catch (error: any) {
      console.error(
        "Fetch profile failed:",
        error.response?.data || error.message,
      );
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
        `${API_URL}/api/auth/profile/avatar`,
        formData,
        { withCredentials: true },
      );

      setUser({
        ...user,
        profile: {
          ...user.profile,
          avatar: res.data.avatarUrl,
        },
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

  const handleEditProfile = () => {
    setModelProfileEdit((prev) => !prev); // ✅ toggle
    setModelEmailEdit(false);
    setModelPasswordEdit(false);
  };
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setErrorsProfileForm(initialErrorsProfile);

    const formDate = {
      mobile: profileForm.mobile,
      name: profileForm.name,
      age: profileForm.profile.age,
      display_name: profileForm.profile.display_name,
      social_links: profileForm.profile.social_links,
    };
    // console.log(formDate);

    try {
      const res = await axios.put(
        `${API_URL}/api/auth/profile/update`,
        formDate,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      const data = res.data.user;

      setProfile((prev) => ({
        ...prev, // ✅ เก็บ email และค่าเดิมไว้
        mobile: data.mobile,
        name: data.name,
        profile: {
          ...prev.profile, // ✅ เก็บ avatar ไว้
          age: data.profile?.age ?? "",
          display_name: data.profile?.display_name ?? "",
          social_links: data.profile?.social_links ?? [],
        },
      }));
      setProfileForm({
        mobile: data.mobile,
        name: data.name,
        profile: {
          age: data.profile?.age ?? "",
          display_name: data.profile?.display_name ?? "",
          social_links: data.profile?.social_links ?? [],
        },
      });
      Swal.fire({
        title: "Profile updated 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const err = error.response?.data;

      if (Array.isArray(err?.errors)) {
        const fieldErrorsProfile = structuredClone(initialErrorsProfile); // ✅ deep copy ปลอดภัย

        err.errors.forEach(
          (e: { field: keyof ErrorsProfile; message: string }) => {
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

        setErrorsProfileForm(fieldErrorsProfile);
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
      setLoadingProfile(false);
    }
  };
  const handleEditEmail = () => {
    setModelEmailEdit((prev) => !prev); // ✅ toggle
    setModelProfileEdit(false);
    setModelPasswordEdit(false);
  };
  const handleEditPassword = () => {
    setModelPasswordEdit((prev) => !prev); // ✅ toggle
    setModelProfileEdit(false);
    setModelEmailEdit(false);
  };
  if (authLoading) return null;
  if (!user) return null; // กัน render ตอนกำลัง redirect
  return (
    <div className="container max-w-2xl py-10 animate-fade-in">
      <h1 className="font-heading text-3xl font-bold mb-8">Profile Settings</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Avatar</CardTitle>
          <CardDescription>
            Click to change your profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div
            className={`relative group ${uploadingAvatar ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-20 w-20">
              {avatarSrc && (
                <AvatarImage
                  src={avatarSrc}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {(displayName || user?.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-background" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {uploadingAvatar ? "Uploading..." : "JPG, PNG or WebP. Max 2MB."}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          {errorImage.avatar && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-pulse">
              <span>⚠️</span>
              <p>{errorImage.avatar}</p>
            </div>
          )}
        </CardFooter>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div>
              <p>username : {profile.name || "ไม่ระบุ"}</p>
              <small className="text-gray-500 text-xs">
                ใช้สำหรับเข้าสู่ระบบและแสดงต่อสาธารณะ
              </small>
            </div>
            <div>
              <p>display name : {profile.profile.display_name || "ไม่ระบุ"}</p>
              <small className="text-gray-500 text-xs">
                ชื่อที่จะแสดงในหน้าโปรไฟล์
              </small>
            </div>
            <div>
              <p>age : {profile.profile.age || "ไม่ระบุ"}</p>
              <small className="text-gray-500 text-xs">
                เขียนคำอธิบายสั้น ๆ เกี่ยวกับตัวคุณ
              </small>
            </div>
            <div>
              <p>social_links </p>
              {/* {(profile.profile.social_links?.length ?? 0) > 5 ? ( */}
              {profile.profile.social_links ? (
                profile.profile.social_links!.map((link) => (
                  <div key={link._id}>
                    <span>{link.platform}: </span>
                    <a
                      href={link.url}
                      target="_blank"
                      className="text-blue-500"
                    >
                      {link.url}
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">ไม่ระบุ</p>
              )}

              <small className="text-gray-500 text-xs">
                เพิ่มลิงก์ไปยังโซเชียลมีเดียของคุณ
              </small>
            </div>
            <div>
              <p>mobile : {profile.mobile || "ไม่ระบุ"}</p>
              <small className="text-gray-500 text-xs">
                เบอร์โทรศัพท์สำหรับติดต่อ
              </small>
            </div>
            <div className=" flex ">
              <div>
                <p>email : {profile.email || "ไม่ระบุ"}</p>
                <small className="text-gray-500 text-xs">
                  ใช้สำหรับยืนยันตัวตนและการแจ้งเตือน
                </small>
              </div>
              <button
                type="button"
                className="flex justify-items-center"
                onClick={handleEditEmail}
              >
                <PenLine className=" mx-4 h-4 w-4 text-shadow-accent-foreground  cursor-pointer" />
                change email
              </button>
            </div>
            <div className=" flex ">
              <p className=" mr-3">password </p>
              <button
                type="button"
                className="flex justify-items-center"
                onClick={handleEditPassword}
              >
                <PenLine className=" mx-4 h-4 w-4 text-shadow-accent-foreground  cursor-pointer" />
                change password
              </button>
              {/* <small className="text-gray-500 text-xs">
                ใช้สำหรับยืนยันตัวตนและการแจ้งเตือน
              </small> */}
            </div>
          </div>

          <Button
            onClick={handleEditProfile}
            disabled={loadingProfile}
            className="cursor-pointer"
          >
            <Pencil className=" h-4 w-4 text-shadow-accent-foreground" />
            {/* 
            <Save className="mr-1.5 h-4 w-4" /> */}
            {modelProfileEdit ? "close model profile " : "edit profile"}
          </Button>
        </CardContent>
      </Card>
      {modelProfileEdit && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full p-6 rounded-xl shadow-lg"
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Edit Display Name
              </CardTitle>
              <CardDescription>
                This is how your name appears on your blog posts
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={handleChangeProfile}
                      placeholder="Enter you name"
                      className={`pl-10 ${errorsProfileForm.name && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    />
                  </div>
                  {errorsProfileForm.name && (
                    <div className="w-full text-red-500 text-sm mt-1">
                      <span className="text-red-500 text-sm ">
                        {errorsProfileForm.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">display name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="display_name"
                      value={profileForm.profile.display_name}
                      onChange={handleChangeProfile}
                      placeholder="Your display name"
                      className={`pl-10 ${errorsProfileForm.profile.display_name && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    />
                  </div>
                  {errorsProfileForm.profile.display_name && (
                    <div className="w-full text-red-500 text-sm mt-1">
                      <span className="text-red-500 text-sm ">
                        {errorsProfileForm.profile.display_name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">age</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="age"
                      value={profileForm.profile.age}
                      onChange={handleChangeProfile}
                      placeholder="Your age "
                      className={`pl-10 ${errorsProfileForm.profile.age && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    />
                  </div>
                  {errorsProfileForm.profile.age && (
                    <div className="w-full text-red-500 text-sm mt-1">
                      <span className="text-red-500 text-sm ">
                        {errorsProfileForm.profile.age}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    {profileForm.profile.social_links.length < 5 ? (
                      <button
                        onClick={() =>
                          setProfileForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              social_links: [
                                ...prev.profile.social_links,
                                { platform: "", url: "" },
                              ],
                            },
                          }))
                        }
                        type="button"
                        className="text-blue-500 mt-2"
                      >
                        + เพิ่ม social link
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <Label htmlFor="displayName">social_links</Label>
                  {profileForm.profile.social_links.map((link, index) => (
                    <div key={index} className="flex flex-wrap gap-2 mb-2">
                      {/* platform */}
                      <select
                        value={link.platform}
                        onChange={(e) => {
                          const newLinks = [
                            ...profileForm.profile.social_links,
                          ];
                          newLinks[index].platform = e.target.value;
                          // setSocial_links(newLinks);
                          setProfileForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              social_links: newLinks,
                            },
                          }));
                        }}
                        required
                        className="basis-1/12 border p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Platform --</option>
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="other">other</option>
                      </select>

                      {/* url */}
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [
                            ...profileForm.profile.social_links,
                          ];
                          newLinks[index].url = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              social_links: newLinks,
                            },
                          }));
                        }}
                        placeholder="https://..."
                        className={`pl-10 ${errorsProfileForm.profile.social_links?.[index]?.url && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"} basis-8/12 border p-2 rounded`}
                      />
                      {/* delete */}
                      <button
                        onClick={() => {
                          setProfileForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              social_links: prev.profile.social_links.filter(
                                (_, i) => i !== index,
                              ),
                            },
                          }));
                        }}
                        type="button"
                        className="basis-1 text-red-500"
                      >
                        ลบ
                      </button>

                      {errorsProfileForm.profile.social_links?.[index]?.url && (
                        <div className="w-full text-red-500 text-sm mt-1">
                          <span className="text-red-500 text-sm ">
                            {errorsProfileForm.profile.social_links[index]?.url}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">mobile</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="mobile"
                      value={profileForm.mobile}
                      onChange={handleChangeProfile}
                      placeholder="Your  mobile "
                      className={`pl-10 ${errorsProfileForm.mobile && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    />
                  </div>
                  {errorsProfileForm.mobile && (
                    <div className="w-full text-red-500 text-sm mt-1">
                      <span className="text-red-500 text-sm ">
                        {errorsProfileForm.mobile}
                      </span>
                    </div>
                  )}
                </div>

                <Button disabled={loadingProfile}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {loadingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      )}

      {modelPasswordEdit && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full p-6 rounded-xl shadow-lg"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password_old">Old Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password_old"
                      type={showPasswords.oldPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={fromNewPassword.password_old}
                      onChange={handleChangePassword}
                      className={`pl-10 pr-10 ${
                        Array.isArray(passwordError.password_old) &&
                        passwordError.password_old.length > 0
                          ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          : ""
                      }`}
                      required
                      minLength={6}
                    />

                    <button
                      type="button"
                      onClick={() => togglePassword("oldPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.oldPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {Array.isArray(passwordError.password_old) &&
                    passwordError.password_old.map((err, i) => (
                      <p key={i} className="text-red-500 text-sm">
                        {err}
                      </p>
                    ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_new">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password_new"
                      type={showPasswords.newPassword ? "text" : "password"}
                      placeholder="Repeat New password"
                      value={fromNewPassword.password_new}
                      onChange={handleChangePassword}
                      className={`pl-10 pr-10 ${
                        Array.isArray(passwordError.password_new) &&
                        passwordError.password_new.length > 0
                          ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          : ""
                      }`}
                      required
                      minLength={6}
                    />

                    <button
                      type="button"
                      onClick={() => togglePassword("newPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.newPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {Array.isArray(passwordError.password_new) &&
                    passwordError.password_new.map((err, i) => (
                      <p key={i} className="text-red-500 text-sm">
                        {err}
                      </p>
                    ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password_confirm"
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      placeholder="Repeat password confirm"
                      value={fromNewPassword.password_confirm}
                      onChange={handleChangePassword}
                      className={`pl-10 pr-10 ${
                        Array.isArray(passwordError.password_confirm) &&
                        passwordError.password_confirm.length > 0
                          ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          : ""
                      }`}
                      required
                      minLength={6}
                    />

                    <button
                      type="button"
                      onClick={() => togglePassword("confirmPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {Array.isArray(passwordError.password_confirm) &&
                    passwordError.password_confirm.map((err, i) => (
                      <p key={i} className="text-red-500 text-sm">
                        {err}
                      </p>
                    ))}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={changingPassword}
                >
                  <Lock className="mr-1.5 h-4 w-4" />
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {modelEmailEdit && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full p-6 rounded-xl shadow-lg"
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Change email
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={changeEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">new email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type={"email"}
                      placeholder="send new email"
                      value={formEmail.email}
                      onChange={handleChangeEmail}
                      className={`pl-10 ${emailError.email && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                      required
                    />
                    {emailError && (
                      <div className="w-full text-red-500 text-sm mt-1">
                        <span className="text-red-500 text-sm ">
                          {emailError.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={changingEmail}
                >
                  <Mail className="mr-1.5 h-4 w-4" />
                  {changingEmail ? "sending..." : "send new email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
