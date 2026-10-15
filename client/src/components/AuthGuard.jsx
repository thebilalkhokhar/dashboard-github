"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import {
  getAuthToken,
  getAuthSnapshot,
  getServerAuthSnapshot,
  subscribeToAuthState,
} from "@/lib/api";

export function AuthLoading() {
  return (
    <div
      role="status"
      aria-label="Checking authentication"
      className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500 dark:bg-black dark:text-zinc-400"
    >
      <CircleNotch size={24} className="animate-spin" aria-hidden="true" />
    </div>
  );
}

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const authenticated = useSyncExternalStore(
    subscribeToAuthState,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  useEffect(() => {
    if (pathname && pathname !== "/login" && !getAuthToken()) {
      router.replace("/login");
    }
  }, [authenticated, pathname, router]);

  if (pathname === "/login" || authenticated) {
    return children;
  }

  return <AuthLoading />;
}
