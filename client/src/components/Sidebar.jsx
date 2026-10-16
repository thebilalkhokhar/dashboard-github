"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  GitFork,
  GitPullRequest,
  Gear,
  Moon,
  SignOut,
  SlidersHorizontal,
  Sun,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";
import {
  clearAuthSession,
  getServerAuthUserSnapshot,
  getStoredAuthUserSnapshot,
  subscribeToAuthState,
} from "@/lib/api";
import { setThemePreference, useThemePreference } from "@/lib/theme";

const navigationItems = [
  { label: "Overview", href: "/", icon: SquaresFour, section: "overview" },
  {
    label: "Repositories",
    href: "/#repositories",
    icon: GitFork,
    section: "repositories",
  },
  {
    label: "Developers",
    href: "/#developers",
    icon: Users,
    section: "developers",
  },
  {
    label: "Pull Requests",
    href: "/#pull-requests",
    icon: GitPullRequest,
    section: "pull-requests",
  },
];

const getInitialSection = (pathname) => {
  if (pathname.startsWith("/developers/")) return "developers";
  if (pathname.startsWith("/repos/")) return "repositories";
  return "overview";
};

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GA";

export default function Sidebar({ onOpenSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState(null);
  const [activeSection, setActiveSection] = useState(() =>
    getInitialSection(pathname),
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
  const theme = useThemePreference();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const displayName = user?.name || user?.email || "Signed-in user";
  const avatar = user?.avatarUrl || user?.avatar_url || user?.picture;

  const handleSignOut = () => {
    clearAuthSession();
    router.replace("/login");
  };
  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const updateMenuPosition = () => {
      const button = profileButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      setProfileMenuPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 232)),
        top: rect.top - 8,
      });
    };
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current?.contains(event.target) ||
        profileButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setProfileMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [profileMenuOpen]);

  return (
    <>
      <aside
        aria-label="Primary navigation"
        className={`sticky top-0 z-40 my-3 ml-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col justify-between overflow-hidden whitespace-nowrap rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 ease-in-out md:flex dark:border-zinc-800 dark:bg-zinc-950/90 ${
          expanded ? "w-64" : "w-16"
        }`}
      >
        <div>
          <div className="mb-7 flex h-10 items-center overflow-hidden whitespace-nowrap">
            <div className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <span className="absolute flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-black">
                <Image
                  src="/icon.svg"
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full rounded-lg"
                />
              </span>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setExpanded(true);
                }}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                disabled={expanded}
                className={`absolute inset-0 flex items-center justify-center rounded-xl transition-opacity duration-200 ${
                  expanded
                    ? "pointer-events-none opacity-0"
                    : "opacity-0 hover:bg-zinc-100 group-hover:opacity-100 dark:hover:bg-zinc-900"
                }`}
              >
                <CaretDoubleRight
                  size={19}
                  aria-hidden="true"
                  className="text-zinc-700 dark:text-zinc-200"
                />
              </button>
            </div>
            <span
              className={`overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-900 transition-all duration-200 ease-in-out dark:text-zinc-100 ${
                expanded
                  ? "ml-3 max-w-[160px] opacity-100"
                  : "pointer-events-none max-w-0 opacity-0"
              }`}
            >
              GitHub Analytics
            </span>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setExpanded(false);
              }}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className={`ml-auto shrink-0 rounded-lg p-2 text-zinc-500 transition-opacity duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 ${
                expanded ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <CaretDoubleLeft size={18} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Dashboard sections" className="space-y-1">
            {navigationItems.map(({ label, href, icon: Icon, section }) => {
              const active =
                pathname === "/" && activeSection === section
                  ? true
                  : pathname.startsWith("/developers/") && section === "developers"
                    ? true
                    : pathname.startsWith("/repos/") && section === "repositories";

              return (
                <Link
                  key={section}
                  href={href}
                  onClick={() => setActiveSection(section)}
                  aria-current={active ? "page" : undefined}
                  title={expanded ? undefined : label}
                  className={`group relative flex h-10 items-center gap-0 overflow-hidden whitespace-nowrap rounded-xl px-2.5 text-sm transition-colors duration-200 ${
                    active
                      ? "bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon
                    size={20}
                    weight={active ? "fill" : "regular"}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out ${
                      expanded
                        ? "ml-3 max-w-[160px] opacity-100"
                        : "pointer-events-none max-w-0 opacity-0"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative">
          {profileMenuOpen &&
            profileMenuPosition &&
              createPortal(
                <div
                  ref={profileMenuRef}
                  role="menu"
                  aria-label="User menu"
                  style={{
                    left: profileMenuPosition.left,
                    top: profileMenuPosition.top,
                    transform: "translateY(-100%)",
                  }}
                  className="fixed z-50 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    <Gear size={17} aria-hidden="true" />
                    Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      setThemePreference(isDark ? "light" : "dark")
                    }
                    className="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    <span className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun size={17} aria-hidden="true" />
                      ) : (
                        <Moon size={17} aria-hidden="true" />
                      )}
                      Theme
                    </span>
                    <span className="text-xs text-zinc-400">
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>
                  <div className="my-1.5 border-t border-zinc-200 dark:border-zinc-800" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <SignOut size={17} aria-hidden="true" />
                    Sign Out
                  </button>
                </div>,
                document.body,
              )}

          <button
            ref={profileButtonRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            aria-label={`User menu for ${displayName}`}
            onClick={() => setProfileMenuOpen((open) => !open)}
            className={`flex h-11 w-full items-center overflow-hidden rounded-xl p-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
              expanded ? "gap-2.5" : "gap-0"
            } ${
              profileMenuOpen ? "bg-zinc-100 dark:bg-zinc-900" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {avatar ? (
                <Image
                  src={avatar}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user?.name || user?.email || "")
              )}
            </span>
            <span
              className={`overflow-hidden whitespace-nowrap text-sm font-medium text-zinc-800 transition-all duration-200 ease-in-out dark:text-zinc-200 ${
                expanded
                  ? "ml-0 max-w-[160px] flex-1 opacity-100"
                  : "pointer-events-none max-w-0 opacity-0"
              }`}
            >
              {displayName}
            </span>
            {expanded && (
              <SlidersHorizontal
                size={16}
                className="shrink-0 text-zinc-400"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </aside>

    </>
  );
}
