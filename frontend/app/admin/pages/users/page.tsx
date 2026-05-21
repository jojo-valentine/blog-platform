"use client";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import React, { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/app/lib/config";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/AuthContext";
import { Plus, SquarePen, Loader2, Ban, Trash2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/admin/ui/label";
import { Input } from "@/app/components/admin/ui/input";
import { PaginationTable } from "@/app/components/admin/ui/pagination_custom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/app/components/admin/ui/dialog";
import { CategoryCheckBox } from "@/app/components/ui/categoryCheckBox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/admin/ui/avatar";
export default function PageUser() {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fetchDataUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      setUsers(res.data.data);
      setDisplayName(
        res.data.data?.name ?? res.data.data?.profile?.display_name ?? "",
      );
      setTotalPages(res.data.meta.totalPages);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [, page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (user) {
      fetchDataUsers();
    }
  }, [user, fetchDataUsers, page, debouncedSearch]);
  return (
    <ContentLayout title="pageUser">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 space-y-4">
            {/* Header */}
            <div className="w-full rounded-2xl border bg-background p-5 shadow-sm">
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Roles
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Manage roles and permissions
                  </p>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Search</Label>

                  <input
                    type="text"
                    placeholder="Search roles..."
                    // value={search}
                    // onChange={(e) => handleSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-[320px]"
                  />
                </div>

                {/* Bottom */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  {/* Button */}
                  <Button
                    variant="outline"
                    type="button"
                    className="h-11 rounded-xl bg-green-500 px-5 text-white transition hover:bg-green-600"
                    // onClick={handleCreatePage}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative overflow-x-auto rounded-base border border-default bg-neutral-primary-soft shadow-xs">
              <table className="w-full text-left text-sm text-body">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <TableSkeleton length={6} colSpan={4} />
                  ) : users.length > 0 ? (
                    users.map((u, i) => (
                      <tr
                        key={u._id || i}
                        className="border-b border-border/50 transition hover:bg-muted/30"
                      >
                        {/* User */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <Avatar
                              className="h-12 w-12 border cursor-pointer transition hover:scale-105"
                              onClick={() => {
                                if (!u?.profile?.avatar) return;

                                setSelectedImage(
                                  u.profile.avatar.startsWith("http")
                                    ? u.profile.avatar
                                    : `${API_URL}${u.profile.avatar}`,
                                );
                              }}
                            >
                              {u?.profile?.avatar ? (
                                <AvatarImage
                                  src={
                                    u.profile.avatar.startsWith("http")
                                      ? u.profile.avatar
                                      : `${API_URL}${u.profile.avatar}`
                                  }
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/default/fallback/default-placeholder.png";
                                  }}
                                />
                              ) : null}

                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {(displayName || u?.name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {u.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {u.email}
                              </p>

                              {u.mobile && (
                                <p className="text-xs text-muted-foreground">
                                  {u.mobile}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Profile */}
                        <td className="px-4 py-4 align-top">
                          {u.profile ? (
                            <div className="space-y-3">
                              {/* Display Name */}
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                  {u.profile.display_name}
                                </span>

                                {u.profile.age && (
                                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                    {u.profile.age} years
                                  </span>
                                )}
                              </div>

                              {/* Social Links */}
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Social Links
                                </p>

                                {u.profile.social_links?.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {u.profile.social_links.map(
                                      (link: any, idx: number) => (
                                        <a
                                          key={link._id || idx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-500 hover:underline break-all"
                                        >
                                          {link.platform}: {link.url}
                                        </a>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    No social links
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground">
                              No profile
                            </div>
                          )}
                        </td>
                        {/* Suspend Status */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center">
                            {u.suspended ? (
                              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                                Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="hover:bg-muted"
                            >
                              <SquarePen className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="outline"
                              className={
                                u.suspended
                                  ? "border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                              }
                              // onClick={() =>
                              //   handleSuspendUser(u._id, u.suspended)
                              // }
                            >
                              {u.suspended ? (
                                <RotateCcw className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-muted-foreground"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end pt-4"
                >
                  <PaginationTable
                    page={page}
                    totalPages={totalPages}
                    onValueChange={(p) => setPage(p)}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedImage(null)}
          className="
          fixed inset-0 z-50
          bg-black/80 backdrop-blur-sm
          flex items-center justify-center
          p-4
        "
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            src={selectedImage}
            alt=""
            className="
            max-h-[90vh]
            max-w-[90vw]
            rounded-xl
            shadow-2xl
            object-contain
          "
            onClick={(e) => e.stopPropagation()}
          />

          {/* close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="
            absolute top-4 right-4
            text-white text-3xl
            hover:scale-110 transition
          "
          >
            ✕
          </button>
        </motion.div>
      )}
    </ContentLayout>
  );
}
