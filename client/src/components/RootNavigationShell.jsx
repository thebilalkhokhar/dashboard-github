"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootNavigationShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/login") return children;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
