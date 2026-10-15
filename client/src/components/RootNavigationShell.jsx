"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  subscribeToAuthState,
} from "@/lib/api";

export default function RootNavigationShell({ children }) {
  const pathname = usePathname();
  const authenticated = useSyncExternalStore(
    subscribeToAuthState,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  if (pathname === "/login") return children;

  return (
    <div className="flex min-h-screen w-full">
      {authenticated && <Sidebar />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
