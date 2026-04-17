"use client";
import { Card } from "@/app/components/ui/Card";
import { InputWithLabel, Input } from "@/app/components/ui/Input";
import React, { useState } from "react";
import { buttonVariants } from "@/app/components/ui/Button";
import Link from "next/link";
import { Label } from "@/app/components/ui/Label";
import axios from "axios";
import { API_URL } from "@/app/lib/config";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setForm((prev) => ({ ...prev, [id]: value }));

    // ✅ ล้าง error เฉพาะ field
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการ reload หน้าเมื่อ submit form
    setLoading(true); // ตั้ง state ว่ากำลังโหลด เพื่อโชว์ spinner หรือ disable ปุ่ม
    console.log("check login ");
    setErrors({});
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // ✅ แทน credentials
      });
      const data = res.data; // ✅ Axios ใช้ .data
      if (!data.ok) {
        if (Array.isArray(data.errors)) {
          const fieldErrors: typeof errors = {};

          data.errors.forEach((err: any) => {
            if (err.field === "email") {
              fieldErrors.email = err.message;
            } else if (err.field === "password") {
              fieldErrors.password = err.message;
            }
          });

          setErrors(fieldErrors);
        }
        return;
      }
    } catch (error: any) {
      console.error("Login error:", error);

      setErrors({
        email: "",
        password: error.response?.data?.message || "Login failed",
      });
    } finally {
      setLoading(false); // ✅ stop loading after fetch
    }
  };
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-xl mx-auto p-6">
        <div>
          <h2 className="text-xl text-black dark:text-black font-semibold mb-1">
            Welcome
          </h2>
          <p className="text-gray-600 mb-6">
            This is a reusable card component.
          </p>
        </div>
        {/* <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required /> */}
        <form
          action=""
          method="get"
          className="space-y-4"
          onSubmit={handleLogin}
        >
          <div>
            <Label htmlFor="email" className="text-black">
              Email
            </Label>
            <div className="relative">
              {/* Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>

              {/* Input */}
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`w-full rounded-md border 
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ring-offset-blue-600
                ${errors.email ? "border-red- ring-offset-red-600 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-black">
              Password
            </Label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>

              <Input
                id="password"
                type="password"
                placeholder="•   •   •   •   •   •   •"
                className={`w-full rounded-md border 
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ring-offset-blue-600
                ${errors.password ? "border-red-500 ring-offset-red-600 focus:ring-red-500" : "border-gray-300 dark:border-gray-700"}`}
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">
            Don't have an account?
            <Link
              href="/auth/register"
              className="ml-3 font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Sign up
            </Link>
          </p>

          <p className="text-sm text-muted-foreground">
            Forgot password?
            <Link
              href="/auth/register"
              className="ml-3 font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Click here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
