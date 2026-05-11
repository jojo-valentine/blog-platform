"use client";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { API_URL } from "@/app/lib/config";
import {
  SquarePen,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/components/admin/ui/button";
import { Label } from "@/app/components/admin/ui/label";
import { Input } from "@/app/components/admin/ui/input";
import { formatDate } from "@/app/lib/format-date";
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
// import { Skeleton } from "@/components/ui/skeleton"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/app/components/admin/ui/field";
import { text } from "stream/consumers";
import Swal, { SweetAlertResult } from "sweetalert2";
type Category = {
  _id?: string;
  name: string;
  uploadedBy?: { name: string }; // 👈 คนที่สร้าง/อัปโหลด
  createdAt?: string; // 👈 วันที่สร้าง
  updatedAt?: string; // 👈 วันที่แก้ไข
  deletedAt?: string | null; // 👈 วันที่ลบ (nullable)
};
// ค่าเริ่มต้น
const initialCategory: Category = {
  name: "",
};

// error state แยกออกมา
type categoryError = {
  name?: string;
};
const initialCategoryError: categoryError = {
  name: "",
};
export default function PageCategory() {
  const { user, loading: loadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [dialogEdit, setDialogEdit] = useState(false);
  const [dialogCreate, setDialogCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<Category>(initialCategory);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [formEdit, setFormEdit] = useState<Category>(initialCategory);
  const [formError, setFormError] =
    useState<categoryError>(initialCategoryError);
  const [formEditError, setFormEditError] =
    useState<categoryError>(initialCategoryError);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/list/categories`, {
        withCredentials: true,
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
        },
      });
      const data = res.data;
      // console.log(data.data);

      setCategories(data.data);
    } catch (error: any) {
      console.error(
        "Fetch data failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1500); // ⏱ 500ms

    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (user) fetchCategories();
  }, [user, fetchCategories, page, debouncedSearch]);

  const onChangeCreate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, name, value } = e.target;
    setFormCreate((prev) => ({
      ...prev,
      [id]: value,
    }));
    setFormError((prev) => ({
      ...prev,
      [id]: "",
    }));
  };
  const onChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormEdit((prev) => ({
      ...prev,
      [id]: value,
    }));
    setFormEditError((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  const handleSubmitFromCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    setFormError({});
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/list/categories/create`,
        formCreate,
        { withCredentials: true },
      );

      const data = res.data;
      Swal.fire({
        title: "Successfully",
        icon: "success",
        timer: 1500,
        text: "Category has been updated",
        showConfirmButton: false,
      });

      setCategories((prev) => [data.data, ...prev]);
      setDialogCreate(false);
      setFormCreate(initialCategory);
    } catch (error: any) {
      const err = error.response?.data;
      const fieldErrors = structuredClone(initialCategoryError);
      err.errors.forEach(
        (e: { field: keyof categoryError; message: string }) => {
          fieldErrors[e.field] = e.message;
        },
      );
      setFormError(fieldErrors);
      Swal.fire({
        title: "Error",
        icon: "error",
        timer: 1500,
        text: "Something went wrong",
        showConfirmButton: false,
      });
    } finally {
      setLoadingCreate(false);
    }
  };
  const handleEdit = async (id: string) => {
    const found = categories.find((c) => c._id === id);
    if (!found) return;
    setFormEdit(found); // ✅ หาจาก list เลย
    setDialogEdit(true);
  };
  const handleSubmitFromEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEdit(true);
    setFormEditError({});
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/list/categories/${formEdit._id}/update`,
        formEdit,
        { withCredentials: true },
      );

      const data = res.data;
      Swal.fire({
        title: "Successfully",
        icon: "success",
        timer: 1500,
        text: "Category has been updated",
        showConfirmButton: false,
      });
      setCategories((prev) =>
        prev.map((c) => (c._id === data.data._id ? data.data : c)),
      );
      setDialogEdit(false);
      setFormEdit(initialCategory);
    } catch (error: any) {
      const err = error.response?.data;
      const fieldErrors = structuredClone(initialCategoryError);
      err.errors.forEach(
        (e: { field: keyof categoryError; message: string }) => {
          fieldErrors[e.field] = e.message;
        },
      );
      setFormEditError(fieldErrors);
      Swal.fire({
        title: "Error",
        icon: "error",
        timer: 1500,
        text: "Something went wrong",
        showConfirmButton: false,
      });
    } finally {
      setLoadingEdit(false);
    }
  };
  const handleDelete = async (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result: SweetAlertResult) => {
      if (result.isConfirmed) {
        // ✅ result มี type-safe แล้ว
        try {
          const res = await axios.delete(
            `${API_URL}/api/admin/list/categories/${id}/delete`,
            { withCredentials: true },
          );

          const data = res.data;

          setCategories((prev) =>
            prev.filter((cat) => cat._id !== data.data._id),
          );

          Swal.fire({
            title: "Deleted!",
            text: "Category deleted successfully.",
            icon: "success",
          });
        } catch (error) {
          Swal.fire({
            title: "Error",
            text: "There was a problem deleting the category.",
            icon: "error",
          });
        }
      }
    });
  };

  return (
    <ContentLayout title="categories">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage image categories
          </p>
        </div>

        <Button
          variant="outline"
          type="button"
          className="flex items-center gap-2 cursor-pointer bg-green-500 text-white hover:bg-green-600 px-3 py-2 rounded-md"
          onClick={() => setDialogCreate(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Button>
      </div>

      <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
          <thead className="text-sm text-body bg-neutral-secondary-soft border-b rounded-base border-default">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                name category
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                user update
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                create
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                update Date
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                delete
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                action
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr
                key={cat._id || index}
                className="bg-neutral-primary border-b border-default"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-heading whitespace-nowrap"
                >
                  {cat.name}
                </th>

                <td className="px-6 py-4">
                  {" "}
                  {cat.uploadedBy?.name || "ไม่ระบุ"}
                </td>
                <td className="px-6 py-4">{formatDate(cat.createdAt)}</td>

                <td className="px-6 py-4">
                  {formatDate(cat.updatedAt) || (
                    <span className="text-muted-foreground">Not updated</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {formatDate(cat.deletedAt) || (
                    <span className="text-muted-foreground">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <Button
                    type="button"
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border cursor-pointer"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      handleEdit(cat._id!);
                    }}
                  >
                    <SquarePen className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border cursor-pointer"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      handleDelete(cat._id!);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialogEdit && (
        <Dialog open={dialogEdit} onOpenChange={setDialogEdit}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>

              <DialogDescription>
                Update the category name below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitFromEdit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <Label htmlFor="name">Category Name</Label>

                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter category name"
                    value={formEdit.name}
                    onChange={onChangeEdit}
                    required
                    className={formError.name ? "border-red-500" : ""}
                  />
                  {formError.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {formError.name}
                    </p>
                  )}
                </Field>
              </FieldGroup>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" disabled={loadingEdit}>
                  {loadingEdit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
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
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>

              <DialogDescription>
                Create a new category for organizing images.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitFromCreate} className="space-y-4">
              <FieldGroup>
                <Field>
                  <Label htmlFor="name">Category Name</Label>

                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter category name"
                    required
                    value={formCreate.name}
                    onChange={onChangeCreate}
                    className={formEditError.name ? "border-red-500" : ""}
                  />
                </Field>
                {formEditError.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {formEditError.name}
                  </p>
                )}
              </FieldGroup>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" disabled={loadingCreate}>
                  {loadingCreate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </ContentLayout>
  );
}
