"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SettingsModal from "@/components/SettingsModal";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  getServerAuthUserSnapshot,
  getStoredAuthUserSnapshot,
  subscribeToAuthState,
} from "@/lib/api";

export default function RootNavigationShell({ children }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const authenticated = useSyncExternalStore(
    subscribeToAuthState,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
  const storedUser = useSyncExternalStore(
    subscribeToAuthState,
    getStoredAuthUserSnapshot,
    getServerAuthUserSnapshot,
  );
  const user = useMemo(() => {
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Failed to read the signed-in user profile:", error);
      return null;
    }
  }, [storedUser]);

  if (pathname === "/login") return children;

  return (
    <div className="flex min-h-screen w-full">
      {authenticated && (
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      )}
      <div className="w-full min-w-0 flex-1">
        {authenticated && (
          <MobileNav onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {children}
      </div>
      {authenticated && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
