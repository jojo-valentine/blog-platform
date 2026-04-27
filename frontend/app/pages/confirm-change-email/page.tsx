"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "loading" | "success" | "error";

export default function ConfirmChangeEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid link (missing token)");
      return;
    }

    const confirmEmail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/confirm-change-email`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to update email");
        }

        setStatus("success");
        setMessage("Your email has been updated successfully 🎉");

        // 👉 optional: redirect หลัง 3 วิ
        setTimeout(() => {
          router.push("/pages/profile");
        }, 3000);

      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Something went wrong");
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
        
        {status === "loading" && (
          <>
            <div className="animate-spin mx-auto mb-4 h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <h2 className="text-lg font-semibold">Confirming your email...</h2>
            <p className="text-gray-500 text-sm">Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-500 text-4xl mb-2">✅</div>
            <h2 className="text-lg font-semibold">Success</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-400 mt-2">
              Redirecting to profile...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-4xl mb-2">❌</div>
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="text-gray-600">{message}</p>

            <button
              onClick={() => router.push("/pages/profile")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to profile
            </button>
          </>
        )}

      </div>
    </div>
  );
}