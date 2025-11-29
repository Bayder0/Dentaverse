import { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  GraduationCap,
  DollarSign,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Stethoscope,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/courses", label: "Courses & Discounts", icon: GraduationCap },
  { href: "/distribution", label: "Money Distribution", icon: DollarSign },
  { href: "/sellers", label: "Sellers & Commissions", icon: Users },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/salaries", label: "Salaries", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Info & Settings", icon: Settings },
];

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const navItems = allNavItems;

  return (
    <div className="flex min-h-screen flex-col bg-cyan-50">
      <div className="w-full bg-cyan-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          Created and Designed by <span className="font-bold">Bayder Bassim</span>
        </p>
      </div>
      <div className="flex flex-1">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-cyan-200 bg-white px-6 py-8 lg:flex relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full -mr-16 -mt-16 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="w-8 h-8 text-cyan-600" />
            <h1 className="text-4xl font-black text-black tracking-tight">
              DentaVerse
            </h1>
          </div>
          <p className="mt-2 text-lg font-bold text-cyan-900">Control Center</p>
          <p className="mt-1 text-base text-cyan-700">Welcome back!</p>
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-2 text-base font-semibold relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg bg-cyan-600 px-4 py-3 text-white transition hover:bg-cyan-700 active:bg-cyan-800"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 bg-cyan-50">
        <header className="flex items-center justify-between border-b border-cyan-200 bg-white px-6 py-5 shadow-sm lg:hidden">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-black text-black">
              DentaVerse
            </h1>
          </div>
        </header>
        <div className="px-6 py-8 lg:px-10">{children}</div>
      </main>
      </div>
    </div>
  );
}

