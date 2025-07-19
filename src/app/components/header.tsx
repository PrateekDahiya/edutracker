"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import ThemeToggle from "../ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBell } from "react-icons/fa";

export default function Header() {
    const { data: session, status } = useSession();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") setIsAuthenticated(true);
        else if (status === "unauthenticated") setIsAuthenticated(false);
    }, [status]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const getNavLinkClass = (path: string) => {
        const isActive = pathname === path;
        return `px-2 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border text-sm sm:text-base ${
            isActive 
                ? 'bg-[var(--primary)] text-[var(--btn-text)] border-[var(--primary)] shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95' 
                : 'bg-[var(--bg-light)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95'
        }`;
    };

    return (
        <header className="flex justify-between items-center bg-[var(--bg-light)]/95 backdrop-blur-md px-2 sm:px-4 md:px-8 py-3 sm:py-6 w-screen fixed z-50 border-b border-[var(--border)] shadow-lg">
            {/* Left: Logo */}
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                <Link href="/" className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors duration-200 hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 cursor-pointer">
                    EduTracker
                </Link>
            </div>

            {/* Center: Main Navigation - Hidden on mobile */}
            {isAuthenticated && (
                <nav className="hidden md:flex gap-2 lg:gap-3">
                    <Link href="/dashboard" className={getNavLinkClass("/dashboard")}>Dashboard</Link>
                    <Link href="/attendance" className={getNavLinkClass("/attendance")}>Attendance</Link>
                    <Link href="/schedule" className={getNavLinkClass("/schedule")}>Schedule</Link>
                    <Link href="/todo" className={getNavLinkClass("/todo")}>ToDo</Link>
                </nav>
            )}

            {/* Right: Theme, Extra Nav, Auth */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Extra nav - hidden on mobile */}
                {isAuthenticated && (
                  <>
                    {/* Show as icon on mobile, styled like theme toggle */}
                    <Link
                      href="/activity"
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] flex items-center justify-center"
                      aria-label="Activity"
                    >
                      <FaBell className="text-lg" />
                    </Link>
                    <Link href="/activity" className={`${getNavLinkClass("/activity")} hidden lg:block`}>Activity</Link>
                  </>
                )}
                {/* Theme Toggle */}
                <ThemeToggle />
                {/* Mobile Menu Button */}
                {isAuthenticated && (
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[var(--bg-light)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] flex items-center justify-center hide-on-mobile"
                    >
                        <span className="text-lg">{isMobileMenuOpen ? '✕' : '☰'}</span>
                    </button>
                )}
                {/* Auth area */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {status === "loading" ? (
                        <>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--border)] animate-pulse" />
                            <div className="w-16 sm:w-20 h-3 sm:h-4 bg-[var(--border)] rounded-xl animate-pulse hidden sm:block" />
                        </>
                    ) : isAuthenticated ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl hover:bg-[var(--bg)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer group">
                                <Image
                                    src={session?.user?.image || "/profile-placeholder.png"}
                                    alt="avatar"
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 border-[var(--primary)] object-cover group-hover:border-[var(--primary)]/80 transition-all duration-200"
                                />
                                <span className="hidden lg:inline text-[var(--text)] font-semibold truncate max-w-[100px] group-hover:text-[var(--primary)] transition-colors duration-200">
                                    {session?.user?.name || session?.user?.email?.split('@')[0]}
                                </span>
                            </Link>
                            <button
                                onClick={async () => {
                                    await signOut({ redirect: false });
                                    router.push('/');
                                }}
                                className="h-8 sm:h-10 px-2 sm:px-4 py-1 sm:py-2 rounded-xl bg-[var(--danger)] text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--danger)]"
                            >
                                <span className="hidden sm:inline">Sign Out</span>
                                <span className="sm:hidden">Out</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="h-8 sm:h-10 px-2 sm:px-4 py-1 sm:py-2 rounded-xl bg-[var(--primary)] text-[var(--btn-text)] text-xs sm:text-sm font-semibold cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent focus:ring-[var(--primary)]"
                        >
                            <span className="hidden sm:inline">Sign In</span>
                            <span className="sm:hidden">In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && isAuthenticated && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-[var(--bg-dark)]/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Mobile Menu */}
                    <div className="absolute top-full left-0 right-0 bg-[var(--bg-light)] border-b border-[var(--border)] shadow-2xl">
                        <nav className="flex flex-col p-4 space-y-2">
                            <Link href="/dashboard" className={getNavLinkClass("/dashboard") + " text-center"}>Dashboard</Link>
                            <Link href="/attendance" className={getNavLinkClass("/attendance") + " text-center"}>Attendance</Link>
                            <Link href="/schedule" className={getNavLinkClass("/schedule") + " text-center"}>Schedule</Link>
                            <Link href="/todo" className={getNavLinkClass("/todo") + " text-center"}>ToDo</Link>
                            <Link href="/activity" className={getNavLinkClass("/activity") + " text-center"}>Activity</Link>
                        </nav>
                    </div>
                </div>
            )}
            <style>{`
              @media (max-width: 640px) {
                .hide-on-mobile { display: none !important; }
              }
            `}</style>
        </header>
    );
}
