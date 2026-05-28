import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  StickyNote,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "",
          label: "Posts",
          icon: SquarePen,
          submenus: [
            {
              href: "/admin/pages/posts",
              label: "All Posts",
            },
            // {
            //   href: "/posts/new",
            //   label: "New Post"
            // }
          ],
        },
        {
          href: "/admin/pages/categories/",
          label: "Categories",
          icon: Bookmark,
        },
        // {
        //   href: "/tags",
        //   label: "Tags",
        //   icon: Tag
        // }
      ],
    },
    {
      groupLabel: "role permission",
      menus: [
        {
          href: "", // ❓ ถ้าไม่ใช้จริงควรลบออก หรือใส่ path ที่ถูกต้อง
          label: "role",
          icon: SquarePen,
          submenus: [
            {
              href: "/admin/pages/roles/",
              label: "All role",
            },
            {
              href: "/admin/pages/roles/role_manager",
              label: "role manager",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "user",
      menus: [
        {
          href: "",
          label: "user",
          icon: Users,
          submenus: [
            {
              href: "/admin/pages/users/",
              label: "Users",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "page",
      menus: [
        {
          href: "/",
          label: "first page",
          icon: StickyNote,
        },
      ],
    },
    {
      groupLabel: "Settings",
      menus: [
        // {
        //   href: "/users",
        //   label: "Users",
        //   icon: Users,
        // },
        {
          href: "/admin/pages/setting/change-password/",
          label: "Account",
          icon: Settings,
        },
      ],
    },
  ];
}
