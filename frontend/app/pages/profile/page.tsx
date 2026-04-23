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
import { Camera, Lock, Eye, EyeOff, Save, Pencil, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/app/lib/config";

type ErrorsImage = {
  avatar?: string;
};
export default function () {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const avatar = user?.profile?.avatar;
  const avatarSrc =
    avatar && (avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`);
  const [email, setEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorImage, setErrorImage] = useState<ErrorsImage>({});
  const [modelProfileEdit, setModelProfileEdit] = useState(false);
  const [modelEmailEdit, setModelEmailEdit] = useState(false);
  const [modelPasswordEdit, setModelPasswordEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const initialForm = {
    email: "",
    name: "",
    mobile: "",
    display_name: "",
    social_links: "",
    bio: "",
  };

  const initialPassword = {
    new_password: "",
    confirm_password: "",
    password: "",
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
              <p>username : nawongjathapon</p>
              <small className="text-gray-500 text-xs">
                ใช้สำหรับเข้าสู่ระบบและแสดงต่อสาธารณะ
              </small>
            </div>
            <div>
              <p>display name : test</p>
              <small className="text-gray-500 text-xs">
                ชื่อที่จะแสดงในหน้าโปรไฟล์
              </small>
            </div>
            <div>
              <p>bio : 18</p>
              <small className="text-gray-500 text-xs">
                เขียนคำอธิบายสั้น ๆ เกี่ยวกับตัวคุณ
              </small>
            </div>
            <div>
              <p>socialLinks : test</p>
              <small className="text-gray-500 text-xs">
                เพิ่มลิงก์ไปยังโซเชียลมีเดียของคุณ
              </small>
            </div>
            <div>
              <p>mobile : 095</p>
              <small className="text-gray-500 text-xs">
                เบอร์โทรศัพท์สำหรับติดต่อ
              </small>
            </div>
            <div className=" flex ">
              <div>
                <p>email : test</p>
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
                change password
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
            // disabled={loading}
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  //   value={displayName}
                  //   onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">display name </Label>
                <Input
                  id="displayName"
                  //   value={displayName}
                  //   onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">bio </Label>
                <Input
                  id="bio"
                  //   value={displayName}
                  //   onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your bio "
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">socialLinks</Label>
                {/* <Input
              id="displayName"
              //   value={displayName}
              //   onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            /> */}
                <Textarea
                  name=""
                  id=""
                  placeholder="socialLinks"
                  rows={4}
                  cols={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">mobile</Label>
                <Input
                  id="mobile"
                  //   value={displayName}
                  //   onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display mobile "
                />
              </div>

              <Button
              //   onClick={handleSaveProfile} disabled={loading}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {/* {loading ? "Saving..." : "Save Changes"} */}
              </Button>
            </CardContent>
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
              <form
                //   onSubmit={handleChangePassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      //  type={showPassword ? "text" : "password"}
                      //   placeholder="Min 6 characters" value={newPassword}
                      //   onChange={e => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      //  onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {/* {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} */}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      // type={showPassword ? "text" : "password"}
                      //  placeholder="Repeat password" value={confirmPassword}
                      //  onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  // disabled={changingPassword}
                >
                  <Lock className="mr-1.5 h-4 w-4" />
                  {/* {changingPassword ? "Changing..." : "Change Password"} */}
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
              <form
                //   onSubmit={handleChangePassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      //  type={showPassword ? "text" : "password"}
                      //   placeholder="Min 6 characters" value={newPassword}
                      //   onChange={e => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      //  onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {/* {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} */}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      // type={showPassword ? "text" : "password"}
                      //  placeholder="Repeat password" value={confirmPassword}
                      //  onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  // disabled={changingPassword}
                >
                  <Lock className="mr-1.5 h-4 w-4" />
                  {/* {changingPassword ? "Changing..." : "Change Password"} */}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
