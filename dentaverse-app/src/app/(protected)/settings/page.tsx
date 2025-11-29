import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { CreateUserForm } from "./create-user-form";
import { SellerRulesForm } from "./seller-rules-form";
import { deleteUserAction } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { Settings, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const currentUser = await requireRole(["OWNER"]);
  const isOwner = currentUser?.role === "OWNER";
  
  const [rules, users] = await Promise.all([
    prisma.sellerLevelRule.findMany({ orderBy: { level: "asc" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plainPassword: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Settings className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Admin controls & info</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">
          Manage seller accounts, commission logic and review platform access.
        </p>
      </header>

      {isOwner && (
        <section className="grid gap-6 lg:grid-cols-2">
          <CreateUserForm />
          <SellerRulesForm
            rules={rules.map((rule) => ({
              level: rule.level,
              minSales: rule.minSales,
              maxSales: rule.maxSales === null ? null : Number(rule.maxSales),
              commissionRate: Number(rule.commissionRate),
            }))}
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Team directory</h2>
        <p className="text-sm text-slate-500">All users who can sign into DentaVerse Control Center.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Name</th>
                <th>Email</th>
                {isOwner && <th>Password</th>}
                <th>Role</th>
                <th>Joined</th>
                {isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-2 font-medium text-slate-900">{user.name ?? "User"}</td>
                  <td>{user.email}</td>
                  {isOwner && (
                    <td className="font-mono text-xs text-slate-600">
                      {user.plainPassword || "••••••••"}
                    </td>
                  )}
                  <td>
                    <span className="inline-block rounded px-2 py-1 text-xs font-semibold bg-cyan-100 text-cyan-800">
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  {isOwner && (
                    <td>
                      <DeleteButton
                        action={deleteUserAction}
                        id={user.id}
                        idFieldName="userId"
                        label="Delete user"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


