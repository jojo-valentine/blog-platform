"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/app/components/ui/card";
import { InputWithLabel, Input } from "@/app/components/ui/input";
import React, { useEffect, useState } from "react";
import { buttonVariants } from "@/app/components/ui/button";
import Link from "next/link";
import { Label } from "@/app/components/ui/label";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, EyeOff, Eye } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Swal from "sweetalert2";
type Errors = {
  password?: string;
  password_confirm?: string;
};
export default function page() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const router = useRouter();
  const initialForm = {
    password: "",
    password_confirm: "",
  };
  const [form, setForm] = useState(initialForm);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const params = useSearchParams();
  const token = params.get("token");
  useEffect(() => {
    if (!token) {
      router.replace("/pages/forgot-password");
      return;
    }
    const verify = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/verify-reset-token`, {
          token,
        });
        if (!res.data.valid) {
          router.replace("/pages/forgot-password?expired=true");
        }
      } catch (err) {
        router.replace("/pages/forgot-password?expired=true");
      }
    };
    verify();
  }, [token, router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    console.log("test");

    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: "Passwords do not match" });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.patch(
        `${API_URL}/api/auth/reset/update/password`,
        {
          ...form,
          token, // 🔥 สำคัญ
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // ✅ แทน credentials
        },
      );
      setErrors(initialForm);

      Swal.fire({
        title:
          "Registration successful! Please verify the OTP sent to your email 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/auth/login");
      });
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors: Errors = {};

        err.errors.forEach((e: { field: keyof Errors; message: string }) => {
          fieldErrors[e.field] = e.message;
        });

        setErrors(fieldErrors);
      } else {
        setErrors({
          password: "",
          password_confirm: error.response?.data?.message || "update failed",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 rounded-xl shadow-lg"
    >
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-xl mx-auto p-6">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl text-start">
              new Password
            </CardTitle>
            <CardDescription className=" text-start">
              Enter your email to new your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                    className={`pl-10 ${errors.password && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="">
                  password confirm
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password_confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Your password confirm"
                    value={form.password_confirm}
                    onChange={handleChange}
                    className={`pl-10 ${errors.password_confirm && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password_confirm && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.password_confirm}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                type="submit"
                className="w-50 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Loading update password..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
