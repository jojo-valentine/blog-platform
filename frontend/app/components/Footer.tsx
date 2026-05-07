"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-gradient-to-b from-neutral-950 to-black text-gray-400">
      {/* glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />

      <div className="container relative px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white text-2xl font-bold tracking-tight"
          >
            BlogSpace
          </Link>

          <p className="mt-4 text-sm leading-relaxed text-gray-500 max-w-xs">
            Discover clean design, dev insights, and modern web trends — written
            by developers, for developers.
          </p>

          {/* social */}
          <div className="flex gap-3 mt-6">
            {[
              {
                icon: faGithub,
                href: "#",
              },
              {
                icon: faTwitter,
                href: "#",
              },
              {
                icon: faLinkedin,
                href: "#",
              },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="
                  group p-2.5 rounded-full
                  border border-white/10
                  bg-white/[0.03]
                  hover:bg-primary
                  hover:border-primary
                  hover:text-white
                  transition-all duration-300
                  hover:scale-110
                "
              >
                <FontAwesomeIcon
                  icon={s.icon}
                  className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">
            Explore
          </h4>

          <ul className="space-y-3 text-sm">
            {[
              { label: "All Posts", href: "/pages/blog/list_post" },
              { label: "Write a Blog", href: "/pages/blog/create" },
              { label: "My Blogs", href: "/pages/blog" },
            ].map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="
                    inline-flex items-center gap-1
                    hover:text-white
                    transition-all duration-300
                    hover:translate-x-1
                  "
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">
            Product
          </h4>

          <ul className="space-y-3 text-sm">
            {["Features", "Pricing", "Changelog", "API Docs"].map((l) => (
              <li key={l}>
                <span
                  className="
                    inline-block cursor-pointer
                    hover:text-white
                    transition-all duration-300
                    hover:translate-x-1
                  "
                >
                  {l}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">
            Company
          </h4>

          <ul className="space-y-3 text-sm">
            {["About", "Careers", "Blog", "Contact"].map((l) => (
              <li key={l}>
                <span
                  className="
                    inline-block cursor-pointer
                    hover:text-white
                    transition-all duration-300
                    hover:translate-x-1
                  "
                >
                  {l}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* bottom */}
      <div className="border-t border-white/10">
        <div
          className="
            container flex flex-col sm:flex-row
            items-center justify-between
            gap-3 py-5 text-xs text-gray-600
          "
        >
          <span>© 2026 BlogSpace. All rights reserved.</span>

          <div className="flex items-center gap-5">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>

            <span className="hover:text-gray-300 cursor-pointer transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
