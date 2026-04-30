"use client";
import React from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <div>{user ? <p>Hello {user.name}</p> : <p>No user logged in</p>}</div>
  );
}
