import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import { formatCurrency, formatPercent } from "@/lib/format";
import { CourseForm } from "./course-form";
import { DiscountForm } from "./discount-form";
import { TemplateForm } from "./template-form";
import { TemplateListSection } from "./template-list-section";
import { DeleteButton } from "@/components/delete-button";
import { deleteCourseAction, deleteDiscountAction } from "@/app/actions";
import { GraduationCap, Stethoscope } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const currentUser = await requireRole(["OWNER"]);
  const isOwner = currentUser?.role === "OWNER";
  const [courses, templates, discounts, buckets] = await Promise.all([
    prisma.course.findMany({
      include: {
        customDistribution: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.distributionTemplate.findMany({
      include: {
        allocations: {
          include: { bucket: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.fundBucket.findMany(),
  ]);

  const parentIds = new Set(buckets.filter((bucket) => bucket.parentId).map((bucket) => bucket.parentId!));
  const leafBuckets = buckets.filter((bucket) => !parentIds.has(bucket.id));

  function bucketPath(bucketId: string) {
    const bucket = buckets.find((b) => b.id === bucketId);
    if (!bucket) return "";
    const parts = [bucket.label];
    let current = bucket;
    while (current.parentId) {
      const parent = buckets.find((b) => b.id === current.parentId);
      if (!parent) break;
      parts.unshift(parent.label);
      current = parent;
    }
    return parts.join(" → ");
  }

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full -ml-24 opacity-15"></div>
      <header className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <GraduationCap className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-base uppercase tracking-[0.3em] font-bold text-cyan-600">Catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-cyan-500 opacity-60" />
          <h1 className="text-3xl font-bold text-cyan-900">Courses, discounts & distribution</h1>
        </div>
        <p className="text-base text-cyan-700 mt-2">
          Configure ministerial and summer programs, then connect them to money distribution templates.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <CourseForm
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
          }))}
          defaultTemplates={{
            MINISTERIAL: templates.find(t => t.applicableTo === "MINISTERIAL")?.id || undefined,
            SUMMER: templates.find(t => t.applicableTo === "SUMMER")?.id || undefined,
          }}
        />
        <DiscountForm />
        <TemplateForm
          buckets={leafBuckets.map((bucket) => ({
            id: bucket.id,
            label: bucket.label,
            path: bucketPath(bucket.id),
          }))}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Course library</h2>
        <p className="text-sm text-slate-500">Active offerings with their prices, stages and templates.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Course</th>
                <th>Type</th>
                <th>Stage</th>
                <th>Base price</th>
                <th>Platform fee</th>
                <th>Distribution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="py-2 font-medium text-slate-900">{course.name}</td>
                  <td>{course.type}</td>
                  <td>{course.stage ?? "—"}</td>
                  <td>{formatCurrency(Number(course.basePrice))}</td>
                  <td>{formatPercent(Number(course.platformFeeRate))}</td>
                  <td>{course.customDistribution?.name ?? "Default"}</td>
                  <td>
                    <DeleteButton
                      action={deleteCourseAction}
                      id={course.id}
                      idFieldName="courseId"
                      label="Delete"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Discount library</h2>
          <p className="text-sm text-slate-500">Manage fixed and percentage-based offers.</p>
          <div className="mt-4 space-y-3">
            {discounts.map((discount) => (
              <div key={discount.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{discount.name}</p>
                    <p className="text-xs text-slate-400">{discount.description ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-cyan-600">
                      {discount.type === "PERCENTAGE"
                        ? `${Number(discount.amount)}%`
                        : formatCurrency(Number(discount.amount))}
                    </p>
                    {isOwner && (
                      <DeleteButton
                        action={deleteDiscountAction}
                        id={discount.id}
                        idFieldName="discountId"
                        label="Delete"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <TemplateListSection 
          templates={templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            applicableTo: t.applicableTo,
            allocations: t.allocations.map(a => ({
              id: a.id,
              bucketId: a.bucketId,
              percentage: Number(a.percentage),
              bucket: {
                id: a.bucket.id,
                label: a.bucket.label,
              },
            })),
          }))} 
          buckets={leafBuckets.map(b => ({
            id: b.id,
            label: b.label,
            path: bucketPath(b.id),
          }))}
        />
      </section>
    </div>
  );
}

