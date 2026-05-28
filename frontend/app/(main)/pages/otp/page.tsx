"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import axios from "axios";
import { API_URL } from "@/app/lib/config";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import { InputOTPSlot } from "@/app/components/ui/input";
import { input } from "motion/react-client";
import { useRouter } from "next/navigation";
export default function page() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("email");
      if (!storedEmail) return;
      setEmail(storedEmail);
      const visible = storedEmail.slice(0, 2);
      const visibleEnd = storedEmail.slice(-10);
      const masked = "*".repeat(Math.max(storedEmail.length - 12, 0));
      setMaskedEmail(`${visible}${masked}${visibleEnd}`);
    }

    // setEmail(storedEmail);
  }, []);
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return; // รับเลขแค่ 1 ตัว

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // 🔥 ย้อนไปช่องก่อน
        inputsRef.current[index - 1]?.focus();
      } else {
        // 🔥 ลบค่าปัจจุบัน
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (e.key === "Delete") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };
  const isComplete = otp.every((digit) => digit !== "");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setLoading(true);
    setErrors({});
    const code = otp.join("");
    console.log("OTP:", code);
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/verify-register-otp`,
        { otp: code },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      const data = res.data;
      Swal.fire({
        title: " successful verify otp🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        text: data.message || "Verify user successfully please check login ",
      }).then(() => {
        router.push("/auth/login/");
      });
    } catch (err: any) {
      //   console.error("Error:", err.response?.status, err.response?.data);
      // ✅ เช็ค status code
      if (err.response?.status === 400) {
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          text: err.response?.data?.message || "Invalid request",
        }).then(() => {
          router.push("/auth/register/");
        });
      } else if (err.response?.status === 401) {
        sessionStorage.removeItem("email");
        Swal.fire({
          title: "Unauthorized",
          icon: "error",
          text: "Please register again",
        }).then(() => {
          router.push("/auth/register/");
        });
      } else {
        Swal.fire({
          title: "Error",
          icon: "error",
          text: err.response?.data?.message || "Something went wrong",
        }).then(() => {
          router.push("/auth/register/");
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleReset = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/otp/resend-otp`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      const data = res.data;
      Swal.fire({
        title: " successful 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        text: data.message || "please check email again ",
      });
      //   console.log(res.data);
    } catch (err: any) {
      // ✅ เช็ค status code
      if (err.response?.status === 400) {
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          text: err.response?.data?.message || "Invalid request",
        });
      } else if (err.response?.status === 401) {
        sessionStorage.removeItem("email");
        Swal.fire({
          title: "Unauthorized",
          icon: "error",
          text: "Please register again",
        }).then(() => {
          router.push("/auth/register/");
        });
      } else {
        Swal.fire({
          title: "Error",
          icon: "error",
          text: err.response?.data?.message || "Something went wrong",
        }).then(() => {
          router.push("/auth/register/");
        });
      }
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
        <form onSubmit={handleSubmit}>
          <Card className="w-full max-w-xl animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">otp</CardTitle>
              <CardDescription>
                Join BlogSpace and start writing {maskedEmail || "ไม่ระบุ"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center justify-center gap-3"
                id="otp-form"
              >
                {otp.map((digit, index) => (
                  <InputOTPSlot
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={!isComplete}
                className={`px-4 py-2 rounded text-white ${
                  isComplete
                    ? "bg-blue-600 cursor-pointer"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? "loading..." : " Verify OTP"}
              </button>
              <p className="text-sm text-muted-foreground">
                Didn't receive code?{" "}
                <button
                  type="button"
                  onClick={handleReset}
                  className="font-medium text-foreground hover:underline cursor-pointer"
                >
                  Resend
                </button>
              </p>
            </CardFooter>
          </Card>
        </form>
      </div>
    </motion.div>
  );
}
