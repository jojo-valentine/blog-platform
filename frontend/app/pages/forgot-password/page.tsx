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
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Swal from "sweetalert2";
type Errors = {
  email?: string;
};

export default function page() {
  const initialForm = { email: "" };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };
  const router = useRouter();
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/reset/forgot-password`,
        form,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // ✅ แทน credentials
        },
      );
      Swal.fire({
        title: "send otp successful 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        text: "please check email otp password",
      }).then(() => {
        // router.push("/");
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
          email: error.response?.data?.message || "reset failed",
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
              Forgot Password
            </CardTitle>
            <CardDescription className=" text-start">
              Enter your email to reset your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Your email"
                    value={form.email}
                    onChange={handleChange}
                    className={`pl-10 ${errors.email && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button type="submit" className="w-50" disabled={loading}>
                {loading ? "Sending reset link..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
