"use client";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import { API_URL } from "@/app/lib/config";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/AuthContext";
import { Plus, SquarePen, Loader2, Trash2, RotateCcw } from "lucide-react";
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
export type RoleItem = {
  name: string;
  _id: string;
};
export type permissions = {
  _id: string;
  createdAt?: string;
  roles: RoleItem[];

  user: {
    name: string;
    email: string;
  };
};
// formEditError
export type permissionsError = {
  _id?: string;
  roles: string[];
  user: {
    name: string;
    email: string;
  };
};
export type formPermissions = {
  _id?: string;
  roles: RoleItem[];
  user: {
    name: string;
    email: string;
  };
};
const initialForm: formPermissions = {
  _id: "",
  user: {
    name: "",
    email: "",
  },
  roles: [] as RoleItem[],
};
const initialFormError: permissionsError = {
  _id: "",
  user: {
    name: "",
    email: "",
  },
  roles: [] as string[],
};
export default function pageRoleManager() {
  const [permissions, setPermissions] = useState<permissions[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [dialogEdit, setDialogEdit] = useState(false);
  const [formEdit, setFormEdit] = useState<formPermissions>(initialForm);
  const [formEditError, setFormEditError] =
    useState<permissionsError>(initialFormError);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/permissions`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      setTotalPages(res.data.meta.totalPages);
      setPermissions(res.data.data);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  const fetchDataRole = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/roles/list`, {
        withCredentials: true,
      });
      setRoles(res.data.data);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (user) {
      fetchData();
      fetchDataRole();
    }
  }, [user, fetchData, fetchDataRole]);
  const handleRoles = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(ids)) return prev;
      return ids;
    });
    setPage(1);
  }, []);
  const handleEdit = async ({ id, role }: { id: string; role: RoleItem[] }) => {
    setDialogEdit(true);

    const perm = await permissions.find((p) => p._id === id);
    if (!perm) return;
    setFormEdit(perm);
    setFormEdit((prev) => ({
      ...prev,
      roles: role, // ✅ set ทั้ง array ตรง ๆ
    }));
  };
  const handleChangeEdit = (
    e: React.ChangeEvent<HTMLInputElement>,
    role?: RoleItem,
  ) => {
    const { name, type, value, checked } = e.target;

    if (type === "checkbox" && role) {
      setFormEdit((prev) => ({
        ...prev,
        roles: checked
          ? [...prev.roles, role] // ✅ เพิ่ม role object
          : prev.roles.filter((r) => r._id !== role._id), // ✅ ลบ role object
      }));
    } else {
      setFormEdit((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setFormEditError((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rolesData = formEdit.roles.map((r) => r._id);

    try {
      setLoadingEdit(true);
      setFormEditError(structuredClone(initialFormError));

      const res = await axios.patch(
        `${API_URL}/api/admin/permissions/${formEdit._id}`,
        { roles: rolesData },
        {
          withCredentials: true,
        },
      );

      // ✅ update state
      setPermissions((prev) =>
        prev.map((item) =>
          item._id === formEdit._id
            ? {
                ...item,

                roles: res.data.data.map((r: any) => ({
                  _id: r.role_id._id,

                  name: r.role_id.name,
                })),
              }
            : item,
        ),
      );
      Swal.fire({
        title: "Updated 🎉",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setDialogEdit(false);
    } catch (error: any) {
      const err = error.response?.data;

      // ✅ validation errors
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormError);

        err.errors.forEach(
          (e: { field: keyof permissionsError; message: string }) => {
            if (typeof e.field === "string" && e.field.includes("roles")) {
              (fieldErrors.roles as string[]).push(e.message);
            } else if (e.field in fieldErrors) {
              (fieldErrors as any)[e.field] = e.message;
            } else {
              (fieldErrors as any).other = e.message;
            }
          },
        );

        setFormEditError(fieldErrors);
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          text: "Please check your inputs",
        });

        return;
      }
      // ✅ normal error
      Swal.fire({
        title: "Error",
        icon: "error",
        text: err?.message || error.message || "Update failed",
      });
    } finally {
      setLoadingEdit(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ContentLayout title="role manager">
        <div className="mb-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Roles</h2>

              <p className="text-sm text-muted-foreground">
                Manage roles and permissions
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categories</Label>

              <CategoryCheckBox
                value={selectedIds}
                categories={roles}
                onValueChange={handleRoles}
              />
            </div>
            <Button
              variant="outline"
              type="button"
              className="flex items-center gap-2 cursor-pointer bg-green-500 text-white hover:bg-green-600"
              // onClick={handleCreatePage}
            >
              <Plus className="w-4 h-4" />

              <span>Add Role</span>
            </Button>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto rounded-base border border-default bg-neutral-primary-soft shadow-xs">
            <table className="w-full text-left text-sm text-body">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Name</th>

                  <th className="px-4 py-3">Permissions</th>

                  <th className="px-4 py-3">Deleted At</th>

                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton length={5} colSpan={3} />
                ) : permissions.length > 0 ? (
                  permissions.map((permission, index) => (
                    <tr
                      key={permission._id || index}
                      className="border-b transition hover:bg-muted/30"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium">{permission.user.name}</p>

                          <p className="text-xs text-muted-foreground">
                            {permission.user.email}
                          </p>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {permission.roles.map((item) => (
                            <span
                              key={item._id}
                              className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {permission.createdAt
                          ? new Date(permission.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              handleEdit({
                                id: permission._id,
                                role: permission.roles,
                              })
                            }
                          >
                            <SquarePen className="h-4 w-4" />
                          </Button>

                          <Button size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-10 text-center text-muted-foreground"
                    >
                      No roles found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* ── Pagination ── */}
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
      </ContentLayout>

      {dialogEdit && (
        <Dialog open={dialogEdit} onOpenChange={setDialogEdit}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User Roles</DialogTitle>

              <DialogDescription>
                Update user role permissions.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-6" onSubmit={handleSubmitEdit}>
              {/* User Info */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">{formEdit.user?.name}</p>

                <p className="text-sm text-muted-foreground">
                  {formEdit.user?.email}
                </p>
              </div>

              {/* Roles */}
              <div className="space-y-3">
                <div>
                  <Label>User Roles</Label>

                  <p className="text-sm text-muted-foreground">
                    Select roles for this user
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {roles.map((role) => {
                    return (
                      <label
                        key={role._id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={formEdit.roles.some(
                            (r) => r._id === role._id,
                          )}
                          onChange={(e) => handleChangeEdit(e, role)}
                        />

                        <span className="capitalize">{role.name}</span>
                      </label>
                    );
                  })}
                </div>

                {formEditError.roles && (
                  <p className="text-sm text-red-500">{formEditError.roles}</p>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loadingEdit}>
                  {loadingEdit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
