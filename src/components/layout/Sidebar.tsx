"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/wardrobe", label: "Wardrobe", icon: "👕" },
  { href: "/outfits", label: "Outfits", icon: "✨" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-400">Wizzardobe</h1>
        <p className="text-xs text-gray-400 mt-1">
          Wardrobe Intelligence System
        </p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-3 px-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm">
            D
          </div>
          <div>
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-gray-400">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
