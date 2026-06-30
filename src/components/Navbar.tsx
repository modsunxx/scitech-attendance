// src/components/Navbar.tsx
import type { User } from "@supabase/supabase-js";

// กำหนดว่า Navbar นี้ต้องการข้อมูลอะไรบ้างจากหน้าหลัก (เหมือน export let ใน Svelte)
interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <nav className="z-10 w-full border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          SC
        </div>
        <h1 className="font-bold text-lg tracking-wide bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          SCITECH Attendance
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-neutral-400">{user.email}</p>
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full border border-neutral-700 shadow-md"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700"></div>
        )}
        <button
          onClick={onLogout}
          className="ml-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-3 py-1.5 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
