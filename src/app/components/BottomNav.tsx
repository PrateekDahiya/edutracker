"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaHome, FaCalendarCheck, FaTasks, FaUser, FaCog } from "react-icons/fa";

export default function BottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || "";
  if (!session) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-light)] border-t border-[var(--border)] flex justify-around items-center py-2 sm:hidden" style={{ boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.06)' }}>
      <Link href="/" className={`flex flex-col items-center text-xs ${pathname === '/' ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)] hover:text-[var(--primary)]'}`}>
        <FaHome className="text-xl mb-0.5" />
        Home
      </Link>
      <Link href="/schedule" className={`flex flex-col items-center text-xs ${pathname.startsWith('/schedule') ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)] hover:text-[var(--primary)]'}`}>
        <FaCalendarCheck className="text-xl mb-0.5" />
        Schedule
      </Link>
      <Link href="/todo" className={`flex flex-col items-center text-xs ${pathname.startsWith('/todo') ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)] hover:text-[var(--primary)]'}`}>
        <FaTasks className="text-xl mb-0.5" />
        ToDo
      </Link>
      <Link href="/profile" className={`flex flex-col items-center text-xs ${pathname.startsWith('/profile') ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)] hover:text-[var(--primary)]'}`}>
        <FaUser className="text-xl mb-0.5" />
        Profile
      </Link>
    </nav>
  );
} 