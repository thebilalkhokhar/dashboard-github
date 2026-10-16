"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gear,
  GitPullRequest,
  List,
  SquaresFour,
  SignOut,
  Users,
  X,
} from "@phosphor-icons/react";
import {
  clearAuthSession,
  getServerAuthUserSnapshot,
  getStoredAuthUserSnapshot,
  subscribeToAuthState,
} from "@/lib/api";

const navigationItems = [
  { label: "Overview", href: "/", icon: SquaresFour },
  { label: "Developers", href: "/#developers", icon: Users },
  {
    label: "Pull Requests",
    href: "/#pull-requests",
    icon: GitPullRequest,
  },
];

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GA";

export default function MobileNav({ onOpenSettings }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
  const displayName = user?.name || user?.email || "Signed-in user";
  const avatar = user?.avatarUrl || user?.avatar_url || user?.picture;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    clearAuthSession();
    router.replace("/login");
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    onOpenSettings();
  };

  return (
    <>
      <header className="sticky top-3 z-40 m-3 mb-0 flex h-14 items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-4 shadow-lg backdrop-blur-md md:hidden">
        <div className="flex min-w-0 items-center gap-2.5 text-zinc-100">
          <Image
            src="/icon.svg"
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded-md"
          />
          <span className="truncate text-sm font-semibold tracking-tight">
            GitHub Analytics
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          <List
            size={24}
            aria-hidden="true"
            className={`absolute transition-all duration-200 ${
              isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            }`}
          />
          <X
            size={24}
            aria-hidden="true"
            className={`absolute transition-all duration-200 ${
              isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            }`}
          />
        </button>
      </header>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <aside
            aria-label="Mobile navigation"
            className="fixed bottom-3 left-3 top-3 z-50 flex w-72 animate-[mobile-nav-slide-in_300ms_ease-out] flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300"
          >
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5 text-zinc-100">
                  <Image
                    src="/icon.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="shrink-0 rounded-md"
                  />
                  <span className="truncate text-sm font-semibold tracking-tight">
                    GitHub Analytics
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Dashboard sections" className="space-y-1">
                {navigationItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900/80 hover:text-zinc-100 active:bg-zinc-900/80 active:text-zinc-100"
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="text-zinc-400 group-hover:text-zinc-100"
                    />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user?.name || user?.email || "")
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {displayName}
                  </span>
                  {user?.email && user.email !== displayName && (
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {user.email}
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenSettings}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
              >
                <Gear size={18} aria-hidden="true" />
                Settings
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm text-zinc-400 transition-colors hover:bg-rose-950/30 hover:text-rose-300"
              >
                <SignOut size={18} aria-hidden="true" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
