"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CalendarDays, Package, Receipt, Users, Layers, FileBarChart, Settings, HardHat, Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-log", label: "Daily Work", icon: CalendarDays },
  { href: "/materials", label: "Materials", icon: Package },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/phases", label: "Phases", icon: Layers },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
            pathname === href
              ? "bg-amber-500 text-stone-900"
              : "text-stone-300 hover:bg-stone-800 hover:text-white"
          }`}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-100 min-h-screen p-4 gap-1 fixed top-0 left-0 z-30">
        <div className="flex items-center gap-2 px-2 py-4 mb-4 border-b border-stone-700">
          <HardHat className="text-amber-400" size={28} />
          <span className="font-bold text-lg leading-tight text-amber-400">
            Construction
            <br />
            <span className="text-stone-200 text-sm font-normal">Tracker</span>
          </span>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-stone-900 text-stone-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <HardHat className="text-amber-400" size={22} />
          <span className="font-bold text-amber-400">Construction Tracker</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-stone-300 hover:text-white">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute top-0 left-0 w-64 h-full bg-stone-900 text-stone-100 p-4 pt-16 flex flex-col gap-1"
            onClick={e => e.stopPropagation()}
          >
            <NavLinks />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
