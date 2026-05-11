"use client";
import React, { useCallback, useState } from "react";
import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
interface Blog {
  _id: string;
  title: string;
  content: string;
  tags_id: Category[]; // ✅ แก้ตรงนี้
  cover_image: string | null;
  is_online: boolean;
  createdAt: string;
}
type Category = {
  _id: string;
  name: string;
};
export default function page() {
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const fetchData = useCallback(async () => {
    const res = await axios.get(``, {});
  }, []);
  return (
    <ContentLayout title="categories">
      <div>categories</div>

      <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table className="w-full text-sm text-left rtl:text-right text-body">
          <thead className="text-sm text-body bg-neutral-secondary-soft border-b rounded-base border-default">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                Product name
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Color
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Price
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-neutral-primary border-b border-default">
              <th
                scope="row"
                className="px-6 py-4 font-medium text-heading whitespace-nowrap"
              >
                Apple MacBook Pro 17"
              </th>
              <td className="px-6 py-4">Silver</td>
              <td className="px-6 py-4">Laptop</td>
              <td className="px-6 py-4">$2999</td>
              <td className="px-6 py-4">231</td>
            </tr>
            <tr className="bg-neutral-primary border-b border-default">
              <th
                scope="row"
                className="px-6 py-4 font-medium text-heading whitespace-nowrap"
              >
                Microsoft Surface Pro
              </th>
              <td className="px-6 py-4">White</td>
              <td className="px-6 py-4">Laptop PC</td>
              <td className="px-6 py-4">$1999</td>
              <td className="px-6 py-4">423</td>
            </tr>
            <tr className="bg-neutral-primary">
              <th
                scope="row"
                className="px-6 py-4 font-medium text-heading whitespace-nowrap"
              >
                Magic Mouse 2
              </th>
              <td className="px-6 py-4">Black</td>
              <td className="px-6 py-4">Accessories</td>
              <td className="px-6 py-4">$99</td>
              <td className="px-6 py-4">121</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ContentLayout>
  );
}
