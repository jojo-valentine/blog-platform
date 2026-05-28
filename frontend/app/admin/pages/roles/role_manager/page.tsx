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
export type formCreate = {
  users: any[];
  roles: RoleItem[];
};
const initialFormCreate: formCreate = {
  users: [],
  roles: [],
};
export type formCreateError = {
  user_id: string;

  roles: {
    _id: string;
    name: string;
  }[];
};
const initialFormCreateError: formCreateError = {
  user_id: "",
  roles: [],
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
  const router = useRouter();
  const [permissions, setPermissions] = useState<permissions[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const { user, loading: loadingAuth } = useAuth();
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
  // const [formEdit, setDialogCreate] = useState<formPermissions>(initialForm);
  const [dialogCreate, setDialogCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<formCreate>(initialFormCreate);
  const [usersPermission, setUsersPermission] = useState<[]>([]);
  const [formCreateError, setFromCreateError] = useState<formCreateError>(
    initialFormCreateError,
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/permissions`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          category: selectedIds,
        },
      });
      setPermissions(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedIds, page, debouncedSearch]);

  const fetchDataRole = useCallback(async () => {
    setLoadingRole(true);
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
      setLoadingRole(false);
    }
  }, []);

  const fetchDataUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/list/user/`, {
        withCredentials: true,
      });
      setUsersPermission(res.data.data);
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: error.response?.data?.message || error.message || "Fetch failed",
      });
    }
  }, []);

  const handleRoles = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(ids)) return prev;
      return ids;
    });
    setPage(1);
  }, []);
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1); // reset page เมื่อเปลี่ยน keyword
  };
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
      setPermissions((prev) => {
        return [
          {
            ...prev.find((item) => item._id === formEdit._id)!,
            roles: res.data.data.map((r: any) => ({
              _id: r.role_id._id,
              name: r.role_id.name,
            })),
          },
          ...prev.filter((item) => item._id !== formEdit._id),
        ];
      });

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

        return;
      } else {
        // ✅ normal error
        Swal.fire({
          title: "Error",
          icon: "error",
          text: err?.message || error.message || "Update failed",
        });
      }
    } finally {
      setLoadingEdit(false);
    }
  };
  const handleChangeCreate = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    role?: RoleItem,
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;

    if (type === "checkbox" && role) {
      setFormCreate((prev) => ({
        ...prev,
        roles: checked
          ? [...prev.roles, role] // ✅ เพิ่ม role object
          : prev.roles.filter((r) => r._id !== role._id), // ✅ ลบ role object
      }));
    } else {
      setFormCreate((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setFromCreateError((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  const handleCreatePage = () => {
    setDialogCreate(true);
    setFromCreateError(initialFormCreateError);
    setFormCreate((prev) => ({
      ...prev,
      users: usersPermission,
    }));
  };
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingCreate(true);
      const res = await axios.post(
        `${API_URL}/api/admin/permissions`,
        {
          user_id: selectedUserId,
          roles: formCreate.roles.map((r) => r._id),
        },
        {
          withCredentials: true,
        },
      );

      Swal.fire({
        title: "success 🎉",
        text: "Role has been create success.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      // [res.data.data, ...prev]
      setPermissions((prev) => {
        const exists = prev.some((p) => p._id === res.data.data._id);

        if (exists) {
          // ลบตัวเก่าออกก่อน
          const filtered = prev.filter((p) => p._id !== res.data.data._id);
          // แล้วเอาตัวใหม่มาใส่บนสุด
          return [res.data.data, ...filtered];
        }

        return [res.data.data, ...prev];
      });
      setDialogCreate(false);
    } catch (error: any) {
      const err = error.response?.data;
      // ✅ validation errors
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormCreateError);
        err.errors.forEach(
          (e: { field: keyof formCreateError; message: string }) => {
            if (typeof e.field === "string" && e.field.includes("roles")) {
              fieldErrors.roles.push({
                _id: "error",
                name: e.message,
              });
            } else if (e.field in fieldErrors) {
              (fieldErrors as any)[e.field] = e.message;
            } else {
              (fieldErrors as any).other = e.message;
            }
          },
        );
        setFromCreateError(fieldErrors);
        return;
      } else {
        // ✅ normal error
        Swal.fire({
          title: "Error",
          icon: "error",
          text: err?.message || error.message || "Update failed",
        });
      }
    } finally {
      setLoadingCreate(false);
    }
  };
  const handleDeletePermission = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete permission?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    // ✅ cancel
    if (!result.isConfirmed) return;

    try {
      setLoadingDeleteId(id);

      await axios.delete(`${API_URL}/api/admin/permissions/${id}`, {
        withCredentials: true,
      });

      // ✅ remove state
      setPermissions((prev) => prev.filter((p) => p._id !== id));

      Swal.fire({
        title: "Deleted",
        text: "Permission deleted successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Delete Error",
        text: "Something went wrong.",
        icon: "error",
      });
    } finally {
      setLoadingDeleteId(null);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/");
      return;
    }
    fetchData();
    fetchDataRole();
    fetchDataUsers();
  }, [
    user,
    fetchData,
    fetchDataRole,
    fetchDataUsers,
    page,
    debouncedSearch,
    selectedIds,
  ]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ContentLayout title="role manager">
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
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-[320px]"
                />
              </div>

              {/* Bottom */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                {/* Categories */}
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Categories</Label>

                  <div className="rounded-xl border bg-muted/30 p-4">
                    {loadingRole ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading roles...
                      </div>
                    ) : (
                      <CategoryCheckBox
                        value={selectedIds}
                        categories={roles}
                        onValueChange={handleRoles}
                      />
                    )}
                  </div>
                </div>

                {/* Button */}
                <Button
                  variant="outline"
                  type="button"
                  className="h-11 rounded-xl bg-green-500 px-5 text-white transition hover:bg-green-600"
                  onClick={handleCreatePage}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </div>
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

                          <Button
                            size="icon"
                            variant="destructive"
                            disabled={loadingDeleteId === permission._id}
                            onClick={() =>
                              handleDeletePermission(permission._id)
                            }
                          >
                            {loadingDeleteId === permission._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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

      {dialogCreate && (
        <Dialog open={dialogCreate} onOpenChange={setDialogCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>create User Roles</DialogTitle>

              <DialogDescription>
                create user role permissions.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-6" onSubmit={handleSubmitCreate}>
              {/* User Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>

                <select
                  className=" w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                  name="user_id"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select user</option>

                  {formCreate.users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.profile?.display_name}
                      {" - "}
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
              {formCreateError.user_id && (
                <p className="text-red-500 text-sm">
                  {formCreateError.user_id}
                </p>
              )}

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
                          checked={formCreate.roles.some(
                            (r) => r._id === role._id,
                          )}
                          onChange={(e) => handleChangeCreate(e, role)}
                        />

                        <span className="capitalize">{role.name}</span>
                      </label>
                    );
                  })}
                </div>

                {formCreateError.roles.length > 0 && (
                  <div className="space-y-1">
                    {formCreateError.roles.map((role, index) => (
                      <p
                        key={role._id || index}
                        className="text-sm text-red-500"
                      >
                        {role.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loadingCreate}>
                  {loadingCreate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      created...
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
