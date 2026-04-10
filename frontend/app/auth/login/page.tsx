"use client";
import { Card } from "@/app/components/ui/Card";
import { InputWithLabel } from "@/app/components/ui/Input";
import React from "react";

export default function page() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="max-w-md">
        <h2 className="text-xl font-semibold">Welcome</h2>
        <p className="text-gray-600">This is a reusable card component.</p>

        <InputWithLabel
          label="Email"
          type="email"
          placeholder="Enter your email"
        />
        <InputWithLabel
          label="Password"
          type="password"
          placeholder="Enter your password"
        />
      </Card>
    </div>
  );
}
