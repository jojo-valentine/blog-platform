"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import Swal from "sweetalert2";
type Errors = {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
};

export default function page() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const initialForm = { email: "", name: "", mobile: "", password: "" };
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.replace("/"); // ✅ ใช้ replace ดีกว่า push
    }
  }, [user, router]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setForm((prev) => ({ ...prev, [id]: value }));

    setErrors((prev) => ({ ...prev, [id]: "" }));
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, form, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // ✅ แทน credentials
      });
      setErrors(initialForm);
      sessionStorage.setItem("email", form.email);
      Swal.fire({
        title:
          "Registration successful! Please verify the OTP sent to your email 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/pages/otp/");
        // router.push(`/pages/otp/?email=${encodeURIComponent(form.email)}`);
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
          name: "",
          email: "",
          password: error.response?.data?.message || "Login failed",
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">
              Create Account
            </CardTitle>
            <CardDescription>Join BlogSpace and start writing</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    className={`pl-10 ${errors.name && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">mobile</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="text"
                    placeholder="Your mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className={`pl-10 ${errors.mobile && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                  />
                </div>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 ${errors.password && "border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"}`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-foreground hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
