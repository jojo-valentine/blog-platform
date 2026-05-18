"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Plus,
  SquarePen,
  Loader2,
  Trash2,
  RotateCcw,
  EyeOff,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/lib/config";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/admin/ui/label";
import { Input } from "@/app/components/admin/ui/input";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/app/components/admin/ui/field";
import { permissionGroups } from "@/app/lib/admin/permission";
import { PermissionList } from "@/app/components/admin/ui/permissions";
import { motion } from "framer-motion";
import { PaginationTable } from "@/app/components/admin/ui/pagination_custom";
type Role = {
  _id: string;
  name: string;
  permissions: string[];
  show: boolean;
  deletedAt: string | null;
};
type RoleForm = {
  name: string;
  permissions: string[];
};
type RoleFormError = {
  name: string;
  permissions: string[];
  other?: string;
};
const initialForm: RoleForm = {
  name: "",
  permissions: [],
};
const initialFormError: RoleFormError = {
  name: "",
  permissions: [],
  other: "",
};
export default function PageRole() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogEdit, setDialogEdit] = useState(false);
  const [dialogCreate, setDialogCreate] = useState(false);
  const [formEdit, setFormEdit] = useState<RoleForm>(initialForm);
  const [formCreate, setFormCreate] = useState<RoleForm>(initialForm);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formErrorCreate, setFormErrorCreate] =
    useState<RoleFormError>(initialFormError);
  const [formErrorEdit, setFormErrorEdit] =
    useState<RoleFormError>(initialFormError);
  // debounce search
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const [loadingToggle, setLoadingToggle] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [] = useState();
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/admin/roles`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      setRoles(res.data.data || []);
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
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleEdit = (id: string) => {
    setDialogEdit(true);
    setEditId(id);
    const data = roles.find((role) => role._id === id);
    if (data) {
      setFormEdit(data); // ✅ ใช้ได้เมื่อเจอ
    }
  };
  const onChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormEdit((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrorEdit((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  const handlePermissionChangEdit = (permission: string) => {
    setFormEdit((prev) => {
      const exists = prev.permissions.includes(permission);

      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      };
    });
    setFormErrorEdit((prev) => ({
      ...prev,
      permissions: [], // ✅ เคลียร์ array ของ error messages
    }));
  };
  const handlePermissionChangCreate = (permission: string) => {
    setFormCreate((prev) => {
      const exists = prev.permissions.includes(permission);

      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      };
    });
    setFormErrorCreate((prev) => ({
      ...prev,
      permissions: [], // ✅ เคลียร์ array ของ error messages
    }));
  };
  const handleSubmitFromUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUpdate(true);
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/roles/${editId}/update`,
        formEdit,
        {
          withCredentials: true,
        },
      );
      Swal.fire({
        title: "successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        text: "update success",
      });
      setRoles((prev) =>
        prev.map((role) => (role._id === editId ? res.data?.data : role)),
      );
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormError);
        err.errors.forEach(
          (e: { field: keyof RoleFormError; message: string }) => {
            if (e.field.includes("permissions")) {
              fieldErrors.permissions.push(e.message);
            } else {
              (fieldErrors as any)[e.field] = e.message;
            }
          },
        );
        setFormErrorEdit(fieldErrors);
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          text: "Please check your inputs",
        });
      }
    } finally {
      setLoadingUpdate(false);
    }
  };
  const onChangeCreate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormCreate((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrorCreate((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  const handleCreatePage = () => {
    setDialogCreate(true);
    setFormEdit(initialForm);
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/roles/`, formCreate, {
        withCredentials: true,
      });
      Swal.fire({
        title: "successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        text: "create success",
      });
      setFormCreate(initialForm);
      setDialogCreate(false);
      setRoles((prev) => [res.data.data, ...prev]);
    } catch (error: any) {
      const err = error.response?.data;
      if (Array.isArray(err?.errors)) {
        const fieldErrors = structuredClone(initialFormError);
        err.errors.forEach(
          (e: { field: keyof RoleFormError; message: string }) => {
            if (
              typeof e.field === "string" &&
              e.field.includes("permissions")
            ) {
              // ถ้า permissions เป็น array
              (fieldErrors.permissions as string[]).push(e.message);
            } else if (e.field in fieldErrors) {
              // assign ตรง key ที่มีอยู่
              (fieldErrors as any)[e.field] = e.message;
            } else {
              // fallback
              (fieldErrors as any).other = e.message;
            }
          },
        );
        setFormErrorCreate(fieldErrors);
        Swal.fire({
          title: "Validation Error",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          text: "Please check your inputs",
        });
      }
    } finally {
      setLoadingCreate(false);
    }
  };
  const handleDelete = async (id: string, deletedAt?: string | null) => {
    try {
      setLoadingDelete(id);

      const result = await Swal.fire({
        title: deletedAt ? "Restore role?" : "Delete role?",
        text: deletedAt
          ? "This role will be restored."
          : "This role will be deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: deletedAt ? "Restore" : "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: deletedAt ? "#16a34a" : "#dc2626",
      });

      if (!result.isConfirmed) return;
      const res = await axios.patch(
        `${API_URL}/api/admin/roles/${id}/delete`,
        {},
        {
          withCredentials: true,
        },
      );
      // ✅ update state
      setRoles((prev) =>
        prev.map((role) =>
          role._id === id
            ? {
                ...role,
                deletedAt: role.deletedAt ? null : new Date().toISOString(),
              }
            : role,
        ),
      );

      Swal.fire({
        title: deletedAt ? "Restored 🎉" : "Deleted 🎉",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    } finally {
      setLoadingDelete(null);
    }
  };
  const handleToggle = async ({ id, show }: { id: string; show: boolean }) => {
    setLoadingToggle(id);
    try {
      const res = axios.patch(
        `${API_URL}/api/admin/roles/${id}/show/`,
        { show: show },
        {
          withCredentials: true,
        },
      );
      // อัพเดต state roles
      setRoles((prev) =>
        prev.map((r) => (r._id === id ? { ...r, show: show  } : r)),
      );
      Swal.fire({
        title: "Success",
        text: `Role ${show ? "enabled" : "disabled"} successfully`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Toggle role failed:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to toggle role",
        icon: "error",
      });
    } finally {
      setLoadingToggle(null);
    }
  };
  return (
    <ContentLayout title="Role">
      <div className="mb-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Roles</h2>

            <p className="text-sm text-muted-foreground">
              Manage roles and permissions
            </p>
          </div>

          <Button
            variant="outline"
            type="button"
            className="flex items-center gap-2 cursor-pointer bg-green-500 text-white hover:bg-green-600"
            onClick={handleCreatePage}
          >
            <Plus className="w-4 h-4" />

            <span>Add Role</span>
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>

          <input
            type="text"
            placeholder="Search role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-72 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-base border border-default bg-neutral-primary-soft shadow-xs">
        <table className="w-full text-left text-sm text-body">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3">Name</th>

              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3">status</th>

              <th className="px-4 py-3">Deleted At</th>

              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableSkeleton length={5} colSpan={3} />
            ) : roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role._id} className="border-b last:border-none">
                  <td className="px-4 py-3 font-medium">{role.name}</td>

                  <td className="px-4 py-3">
                    {role.permissions.length > 0
                      ? role.permissions.join(", ")
                      : "-"}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${role.deletedAt ? "bg-gray-500/10 text-gray-600" : role.show === false ? "bg-red-500/10 text-red-600" : role.show === true ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}
                    >
                      {role.deletedAt
                        ? "Deleted"
                        : role.show === false
                          ? "Suspended"
                          : role.show === true
                            ? "Published"
                            : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{role.deletedAt || "-"}</td>
                  <td>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(role._id)}
                    >
                      <SquarePen className="w-4 h-4" />
                    </Button>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center rounded-md border p-2 transition ${role.show === false ? "border-green-200 text-green-500 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}
                      onClick={() =>
                        handleToggle({ id: role._id, show: !role.show })
                      }
                    >
                      {" "}
                      {loadingDelete === role._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : role.show === false ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center rounded-md border p-2 transition ${
                        role.deletedAt
                          ? "border-green-200 text-green-500 hover:bg-green-50"
                          : "border-red-200 text-red-500 hover:bg-red-50"
                      }`}
                      onClick={() => handleDelete(role._id!, role?.deletedAt)}
                    >
                      {loadingDelete === role._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : role.deletedAt ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
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
      {dialogEdit && (
        <Dialog open={dialogEdit} onOpenChange={setDialogEdit}>
          <DialogContent className="w-full overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl sm:max-w-lg lg:max-w-3xl">
            {/* Header */}
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="text-xl font-semibold">
                Edit Role
              </DialogTitle>

              <DialogDescription className="text-sm text-muted-foreground">
                Manage role information and permissions.
              </DialogDescription>
            </DialogHeader>

            {/* Body */}
            <form
              className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5"
              onSubmit={handleSubmitFromUpdate}
            >
              {formErrorEdit.other && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrorEdit.other}
                </p>
              )}
              {/* Role Name */}
              <FieldGroup>
                <Field className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>

                  <Input
                    id="name"
                    name="name"
                    value={formEdit.name}
                    onChange={onChangeEdit}
                    placeholder="Enter role name"
                    className="h-11"
                  />
                  {formErrorEdit.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrorEdit.name}
                    </p>
                  )}
                </Field>
              </FieldGroup>

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Permissions</Label>

                  <p className="text-sm text-muted-foreground">
                    Select permissions for this role
                  </p>
                </div>
                {/* ✅ error permissions */}
                {formErrorEdit.permissions.length > 0 && (
                  <p className="text-sm text-red-500 mt-1 whitespace-pre-line">
                    {formErrorEdit.permissions[0]}
                  </p>
                )}

                <PermissionList
                  permissionGroups={permissionGroups}
                  selectedPermissions={formEdit.permissions}
                  onToggle={handlePermissionChangEdit}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="sticky bottom-0 border-t bg-background px-0 pt-4">
                <div className="flex w-full justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button
                    type="submit"
                    className="min-w-28"
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {dialogCreate && (
        <Dialog open={dialogCreate} onOpenChange={setDialogCreate}>
          <DialogContent className="w-full overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl sm:max-w-lg lg:max-w-3xl">
            {/* Header */}
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="text-xl font-semibold">
                Create Role
              </DialogTitle>

              <DialogDescription className="text-sm text-muted-foreground">
                Manage role information and permissions.
              </DialogDescription>
            </DialogHeader>

            {/* Body */}
            <form
              className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5"
              onSubmit={handleCreate}
            >
              {formErrorCreate.other && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrorCreate.other}
                </p>
              )}
              {/* Role Name */}
              <FieldGroup>
                <Field className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>

                  <Input
                    id="name"
                    name="name"
                    value={formCreate.name}
                    onChange={onChangeCreate}
                    placeholder="Enter role name"
                    className="h-11"
                  />
                  {formErrorCreate.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrorCreate.name}
                    </p>
                  )}
                </Field>
              </FieldGroup>

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Permissions</Label>

                  <p className="text-sm text-muted-foreground">
                    Select permissions for this role
                  </p>
                </div>
                {/* ✅ error permissions */}
                {formErrorCreate.permissions.length > 0 && (
                  <p className="text-sm text-red-500 mt-1 whitespace-pre-line">
                    {formErrorCreate.permissions[0]}
                  </p>
                )}

                <PermissionList
                  permissionGroups={permissionGroups}
                  selectedPermissions={formCreate.permissions}
                  onToggle={handlePermissionChangCreate}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="sticky bottom-0 border-t bg-background px-0 pt-4">
                <div className="flex w-full justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button
                    type="submit"
                    className="min-w-28"
                    disabled={loadingCreate}
                  >
                    {loadingCreate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "create role"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </ContentLayout>
  );
}
