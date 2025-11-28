"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getMonthKey } from "@/lib/date";
import { authConfig } from "@/lib/auth";
import { calculateSaleFinancials, determineSellerLevel } from "@/lib/calculations";
import { computeMonthlyMetrics } from "@/lib/kpis";

type ActionResult = {
  success?: string;
  error?: string;
};

async function getSessionUser() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createCourseAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const schema = z.object({
      name: z.string().min(3),
      type: z.string().min(1),
      stage: z
        .string()
        .optional()
        .transform((value) => (value ? Number(value) : null)),
      basePrice: z.coerce.number().positive(),
      platformFeePercent: z.coerce.number().min(0).max(100).optional(),
      platformFeeRate: z.coerce.number().min(0).max(1).optional(),
      templateId: z.string().optional(),
    });

    const rawInput = {
      name: formData.get("name"),
      type: formData.get("type"),
      stage: formData.get("stage"),
      basePrice: formData.get("basePrice"),
      platformFeePercent: formData.get("platformFeePercent"),
      platformFeeRate: formData.get("platformFeeRate"),
      templateId: formData.get("templateId"),
    };

    const parsed = schema.parse(rawInput);
    
    // Convert percentage to decimal if provided as percentage
    const platformFeeRate = parsed.platformFeePercent 
      ? parsed.platformFeePercent / 100 
      : (parsed.platformFeeRate ?? 0.135);

    const input = {
      name: parsed.name,
      type: parsed.type,
      stage: parsed.stage,
      basePrice: parsed.basePrice,
      platformFeeRate,
      templateId: parsed.templateId,
    };

    // Auto-assign default template for MINISTERIAL and SUMMER if no template specified
    let templateId = input.templateId;
    if (!templateId && (input.type === "MINISTERIAL" || input.type === "SUMMER")) {
      const defaultTemplate = await prisma.distributionTemplate.findFirst({
        where: { applicableTo: input.type },
      });
      if (defaultTemplate) {
        templateId = defaultTemplate.id;
      }
    }

    await prisma.course.create({
      data: {
        name: input.name,
        type: input.type,
        stage: input.stage,
        basePrice: input.basePrice,
        platformFeeRate: input.platformFeeRate,
        customDistributionId: templateId || null,
      },
    });

    revalidatePath("/courses");
    revalidatePath("/sales");
    return { success: "Course created." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create course." };
  }
}

export async function createDiscountAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const schema = z.object({
      name: z.string().min(2),
      type: z.enum(["FLAT", "PERCENTAGE"]),
      amount: z.coerce.number().min(0),
      description: z.string().optional(),
    });

    const input = schema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      amount: formData.get("amount"),
      description: formData.get("description"),
    });

    // For percentage, the amount is already in percentage form (e.g., 10 for 10%)
    // No conversion needed - store as-is
    await prisma.discount.create({
      data: input,
    });

    revalidatePath("/courses");
    revalidatePath("/sales");
    return { success: "Discount saved." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save discount." };
  }
}

export async function createDistributionTemplateAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const schema = z.object({
      name: z.string().min(3),
      description: z.string().optional(),
      applicableTo: z.string().optional(),
      allocations: z
        .string()
        .transform((value) => JSON.parse(value) as Array<{ bucketId: string; percentage: number }>),
    });

    const input = schema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      applicableTo: formData.get("applicableTo"),
      allocations: formData.get("allocations"),
    });

    const total = input.allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
    if (Math.abs(total - 1) > 0.01) {
      return { error: "Allocations must sum to 100%." };
    }

    const template = await prisma.distributionTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        applicableTo: input.applicableTo,
        allocations: {
          create: input.allocations.map((allocation) => ({
            bucketId: allocation.bucketId,
            percentage: allocation.percentage,
          })),
        },
      },
    });

    revalidatePath("/distribution");
    revalidatePath("/courses");
    return { success: `Template ${template.name} created.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create template." };
  }
}

export async function updateDistributionTemplateAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const schema = z.object({
      templateId: z.string().min(1),
      name: z.string().min(3),
      description: z.string().optional(),
      applicableTo: z.string().optional(),
      allocations: z
        .string()
        .transform((value) => JSON.parse(value) as Array<{ bucketId: string; percentage: number }>),
    });

    const input = schema.parse({
      templateId: formData.get("templateId"),
      name: formData.get("name"),
      description: formData.get("description"),
      applicableTo: formData.get("applicableTo"),
      allocations: formData.get("allocations"),
    });

    const total = input.allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
    if (Math.abs(total - 1) > 0.01) {
      return { error: "Allocations must sum to 100%." };
    }

    // Delete existing allocations
    await prisma.distributionSlice.deleteMany({
      where: { templateId: input.templateId },
    });

    // Update template and create new allocations
    const template = await prisma.distributionTemplate.update({
      where: { id: input.templateId },
      data: {
        name: input.name,
        description: input.description,
        applicableTo: input.applicableTo,
        allocations: {
          create: input.allocations.map((allocation) => ({
            bucketId: allocation.bucketId,
            percentage: allocation.percentage,
          })),
        },
      },
    });

    revalidatePath("/distribution");
    revalidatePath("/courses");
    return { success: `Template ${template.name} updated.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update template." };
  }
}

export async function deleteUserAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const sessionUser = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER") {
      return { error: "Only owners can delete users." };
    }

    const userId = formData.get("userId");
    if (typeof userId !== "string" || userId.length === 0) {
      return { error: "Invalid user id." };
    }

    if (userId === sessionUser.id) {
      return { error: "You cannot delete your own account." };
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        expenses: true,
        salesEntered: true,
        salaryPayments: true,
        sellerProfile: {
          include: {
            sales: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return { error: "User not found." };
    }

    // Delete related expenses first (they have onDelete: Restrict)
    if (userToDelete.expenses.length > 0) {
      await prisma.expense.deleteMany({
        where: { createdById: userId },
      });
    }

    // Update sales that were recorded by this user (set recordedById to null)
    if (userToDelete.salesEntered.length > 0) {
      await prisma.sale.updateMany({
        where: { recordedById: userId },
        data: { recordedById: null },
      });
    }

    // Delete salary payments created by this user
    if (userToDelete.salaryPayments.length > 0) {
      await prisma.salaryPayment.deleteMany({
        where: { paidById: userId },
      });
    }

    // Delete seller profile and its related sales if it exists
    // (SellerProfile has onDelete: Cascade, but we need to handle sales first)
    if (userToDelete.sellerProfile) {
      // Sales with sellerId will be updated to set sellerId to null
      // since we can't delete sales that might have distributions
      await prisma.sale.updateMany({
        where: { sellerId: userToDelete.sellerProfile.id },
        data: { sellerId: null },
      });
      
      // Now delete the seller profile (will cascade delete level logs)
      await prisma.sellerProfile.delete({
        where: { userId: userId },
      });
    }

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/expenses");
    return { success: "User deleted." };
  } catch (error) {
    console.error("Delete user error:", error);
    return { error: `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function createSellerAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    });

    const input = schema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const nowMonth = getMonthKey(new Date());

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        hashedPassword,
        role: "SELLER",
        sellerProfile: {
          create: {
            level: 1,
            salesThisMonth: 0,
            currentCommission: 0.15,
            monthKey: nowMonth,
          },
        },
      },
    });

    revalidatePath("/sellers");
    return { success: `Seller ${user.name ?? ""} created.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create seller." };
  }
}

export async function recordSaleAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();

    const schema = z.object({
      courseId: z.string().min(1),
      sellerId: z.string().optional(),
      discountId: z.string().optional(),
      saleDate: z.string().transform((value) => new Date(value)),
      note: z.string().optional(),
    });

    const input = schema.parse({
      courseId: formData.get("courseId"),
      sellerId: formData.get("sellerId") || undefined,
      discountId: formData.get("discountId") || undefined,
      saleDate: formData.get("saleDate"),
      note: formData.get("note"),
    });

    const course = await prisma.course.findUnique({
      where: { id: input.courseId },
      include: {
        customDistribution: {
          include: { allocations: true },
        },
      },
    });

    if (!course) {
      return { error: "Course not found." };
    }

    const [discount, sellerProfile, sellerRules, fallbackTemplate] = await Promise.all([
      input.discountId
        ? prisma.discount.findUnique({ where: { id: input.discountId } })
        : null,
      input.sellerId
        ? prisma.sellerProfile.findUnique({
            where: { id: input.sellerId },
          })
        : null,
      prisma.sellerLevelRule.findMany(),
      prisma.distributionTemplate.findFirst({
        where: { applicableTo: course.type },
        include: { allocations: true },
      }),
    ]);

    const monthKey = getMonthKey(input.saleDate);
    let commissionRate = 0;
    let sellerLevelBefore: { id: string; level: number; salesThisMonth: number; currentCommission: number } | null =
      null;

    if (sellerProfile) {
      let workingProfile = sellerProfile;

      if (sellerProfile.monthKey !== monthKey) {
        const baseRule = determineSellerLevel(0, sellerRules);
        workingProfile = await prisma.sellerProfile.update({
          where: { id: sellerProfile.id },
          data: {
            monthKey,
            salesThisMonth: 0,
            level: baseRule.level,
            currentCommission: baseRule.commissionRate,
          },
        });
      }

      const currentRule = determineSellerLevel(workingProfile.salesThisMonth, sellerRules);
      commissionRate = Number(currentRule.commissionRate);
      sellerLevelBefore = {
        id: workingProfile.id,
        level: workingProfile.level,
        salesThisMonth: workingProfile.salesThisMonth,
        currentCommission: Number(workingProfile.currentCommission),
      };
    }

    const basePrice = Number(course.basePrice);
    let discountAmount = 0;

    if (discount) {
      if (discount.type === "PERCENTAGE") {
        discountAmount = (Number(discount.amount) / 100) * basePrice;
      } else {
        discountAmount = Number(discount.amount);
      }
    }

    const financials = calculateSaleFinancials({
      basePrice,
      discountAmount,
      platformFeeRate: Number(course.platformFeeRate),
      commissionRate,
    });

    const template = course.customDistribution ?? fallbackTemplate;
    if (!template) {
      return { error: "No distribution template found for this course." };
    }

    const sale = await prisma.sale.create({
      data: {
        courseId: course.id,
        sellerId: sellerProfile?.id ?? null,
        recordedById: user.id,
        discountId: discount?.id ?? null,
        saleDate: input.saleDate,
        stage: course.stage,
        priceBefore: basePrice,
        discountAmount: discountAmount,
        priceAfterDiscount: financials.priceAfterDiscount,
        platformFee: financials.platformFee,
        profitAfterPlatform: financials.profitAfterPlatform,
        sellerCommission: financials.sellerCommission,
        netProfit: financials.netProfit,
        note: input.note ?? null,
        monthKey,
        distributions: {
          create: template.allocations.map((allocation) => ({
            bucketId: allocation.bucketId,
            percentage: Number(allocation.percentage),
            amount: financials.netProfit * Number(allocation.percentage),
          })),
        },
      },
    });

    if (sellerProfile && sellerLevelBefore) {
      const newCount = sellerLevelBefore.salesThisMonth + 1;
      const updatedRule = determineSellerLevel(newCount, sellerRules);

      await prisma.sellerProfile.update({
        where: { id: sellerProfile.id },
        data: {
          salesThisMonth: newCount,
          level: updatedRule.level,
          currentCommission: updatedRule.commissionRate,
          totalCommissionPaid: Number(sellerProfile.totalCommissionPaid) + financials.sellerCommission,
          monthKey,
        },
      });

      if (updatedRule.level !== sellerLevelBefore.level) {
        await prisma.sellerLevelHistory.create({
          data: {
            sellerId: sellerProfile.id,
            previousLevel: sellerLevelBefore.level,
            newLevel: updatedRule.level,
            previousRate: sellerLevelBefore.currentCommission,
            newRate: Number(updatedRule.commissionRate),
            effectiveMonth: monthKey,
          },
        });
      }
    }

    await computeMonthlyMetrics(monthKey);

    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/distribution");
    revalidatePath("/analytics");
    revalidatePath("/sellers");

    return { success: `Sale #${sale.id.slice(0, 6)} recorded.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to record sale." };
  }
}

export async function recordExpenseAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const schema = z.object({
      bucketId: z.string().min(1),
      description: z.string().min(2),
      amount: z.coerce.number().positive(),
      expenseDate: z.string().transform((value) => new Date(value)),
    });

    const input = schema.parse({
      bucketId: formData.get("bucketId"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      expenseDate: formData.get("expenseDate"),
    });

    const expense = await prisma.expense.create({
      data: {
        bucketId: input.bucketId,
        description: input.description,
        amount: input.amount,
        expenseDate: input.expenseDate,
        monthKey: getMonthKey(input.expenseDate),
        createdById: user.id,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/distribution");

    return { success: `Expense #${expense.id.slice(0, 6)} logged.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to record expense." };
  }
}

export async function createSalaryRecipientAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const schema = z.object({
      name: z.string().min(2),
      roleLabel: z.string().min(2),
      bucketId: z.string(),
      mode: z.enum(["PERCENTAGE", "FIXED", "UNIT"]),
      percentageShare: z.coerce.number().optional(),
      fixedAmount: z.coerce.number().optional(),
      unitRate: z.coerce.number().optional(),
      unitName: z.string().optional(),
      notes: z.string().optional(),
    });

    const input = schema.parse({
      name: formData.get("name"),
      roleLabel: formData.get("roleLabel"),
      bucketId: formData.get("bucketId"),
      mode: formData.get("mode"),
      percentageShare: formData.get("percentageShare"),
      fixedAmount: formData.get("fixedAmount"),
      unitRate: formData.get("unitRate"),
      unitName: formData.get("unitName"),
      notes: formData.get("notes"),
    });

    await prisma.salaryRecipient.create({
      data: {
        name: input.name,
        roleLabel: input.roleLabel,
        bucketId: input.bucketId,
        mode: input.mode,
        percentageShare: input.percentageShare ?? null,
        fixedAmount: input.fixedAmount ?? null,
        unitRate: input.unitRate ?? null,
        unitName: input.unitName ?? null,
        notes: input.notes ?? null,
      },
    });

    revalidatePath("/salaries");
    return { success: "Recipient added." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to add recipient." };
  }
}

export async function recordSalaryPaymentAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const schema = z.object({
      recipientId: z.string().min(1),
      bucketId: z.string().min(1),
      amount: z.coerce.number().positive(),
      periodKey: z.string().min(7),
      notes: z.string().optional(),
      unitsCovered: z.coerce.number().optional(),
    });

    const input = schema.parse({
      recipientId: formData.get("recipientId"),
      bucketId: formData.get("bucketId"),
      amount: formData.get("amount"),
      periodKey: formData.get("periodKey"),
      notes: formData.get("notes"),
      unitsCovered: formData.get("unitsCovered"),
    });

    await prisma.salaryPayment.create({
      data: {
        recipientId: input.recipientId,
        bucketId: input.bucketId,
        paidById: user.id,
        amount: input.amount,
        periodKey: input.periodKey,
        notes: input.notes ?? null,
        unitsCovered: input.unitsCovered ?? null,
      },
    });

    revalidatePath("/salaries");
    revalidatePath("/distribution");
    return { success: "Salary payment recorded." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to record salary payment." };
  }
}

export async function updateSellerRulesAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const schema = z.object({
      payload: z
        .string()
        .transform((value) => JSON.parse(value) as Array<{ level: number; minSales: number; maxSales: number | null; commissionRate: number }>),
    });

    const input = schema.parse({
      payload: formData.get("payload"),
    });

    for (const rule of input.payload) {
      await prisma.sellerLevelRule.upsert({
        where: { level: rule.level },
        update: {
          minSales: rule.minSales,
          maxSales: rule.maxSales,
          commissionRate: rule.commissionRate,
        },
        create: {
          level: rule.level,
          minSales: rule.minSales,
          maxSales: rule.maxSales,
          commissionRate: rule.commissionRate,
        },
      });
    }

    revalidatePath("/sellers");
    revalidatePath("/settings");
    return { success: "Seller levels updated." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update seller levels." };
  }
}

export async function deleteSellerAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER" && userRecord?.role !== "ADMIN") {
      return { error: "Unauthorized." };
    }

    const schema = z.object({
      sellerId: z.string().min(1),
    });

    const input = schema.parse({
      sellerId: formData.get("sellerId"),
    });

    await prisma.sellerProfile.delete({
      where: { id: input.sellerId },
    });

    revalidatePath("/sellers");
    revalidatePath("/settings");
    return { success: "Seller deleted." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete seller." };
  }
}

export async function deleteSaleAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER" && userRecord?.role !== "ADMIN") {
      return { error: "Unauthorized." };
    }

    const schema = z.object({
      saleId: z.string().min(1),
    });

    const input = schema.parse({
      saleId: formData.get("saleId"),
    });

    const sale = await prisma.sale.findUnique({
      where: { id: input.saleId },
      include: { seller: true },
    });

    if (!sale) {
      return { error: "Sale not found." };
    }

    await prisma.sale.delete({
      where: { id: input.saleId },
    });

    if (sale.seller) {
      const monthKey = sale.monthKey;
      const sellerStats = await prisma.sale.groupBy({
        where: {
          sellerId: sale.seller.id,
          monthKey,
        },
        _sum: {
          sellerCommission: true,
        },
        _count: { _all: true },
      });

      const stats = sellerStats[0];
      const newCount = stats?._count._all ?? 0;
      const totalCommission = Number(stats?._sum.sellerCommission ?? 0);

      const sellerRules = await prisma.sellerLevelRule.findMany();
      const { determineSellerLevel } = await import("@/lib/calculations");
      const newRule = determineSellerLevel(newCount, sellerRules);

      await prisma.sellerProfile.update({
        where: { id: sale.seller.id },
        data: {
          salesThisMonth: newCount,
          level: newRule.level,
          currentCommission: newRule.commissionRate,
          totalCommissionPaid: totalCommission,
        },
      });
    }

    await computeMonthlyMetrics(sale.monthKey);

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/sellers");
    return { success: "Sale deleted." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete sale." };
  }
}

export async function deleteCourseAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER" && userRecord?.role !== "ADMIN") {
      return { error: "Unauthorized." };
    }

    const schema = z.object({
      courseId: z.string().min(1),
    });

    const input = schema.parse({
      courseId: formData.get("courseId"),
    });

    await prisma.course.delete({
      where: { id: input.courseId },
    });

    revalidatePath("/courses");
    revalidatePath("/sales");
    return { success: "Course deleted." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete course." };
  }
}

export async function deleteExpenseAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER") {
      return { error: "Only owners can delete expenses." };
    }

    const schema = z.object({
      expenseId: z.string().min(1),
    });

    const input = schema.parse({
      expenseId: formData.get("expenseId"),
    });

    await prisma.expense.delete({
      where: { id: input.expenseId },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/distribution");
    return { success: "Expense deleted." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete expense." };
  }
}

export async function deleteDiscountAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER" && userRecord?.role !== "ADMIN") {
      return { error: "Unauthorized." };
    }

    const schema = z.object({
      discountId: z.string().min(1),
    });

    const input = schema.parse({
      discountId: formData.get("discountId"),
    });

    await prisma.discount.delete({
      where: { id: input.discountId },
    });

    revalidatePath("/courses");
    revalidatePath("/sales");
    return { success: "Discount deleted." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete discount." };
  }
}

export async function createUserAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRecord?.role !== "OWNER") {
      return { error: "Only owners can create users." };
    }

    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["OWNER", "SELLER"]),
    });

    const input = schema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const nowMonth = getMonthKey(new Date());

    const userData: any = {
      name: input.name,
      email: input.email,
      hashedPassword,
      plainPassword: input.password, // Store plain password for owner visibility
      role: input.role,
    };

    if (input.role === "SELLER") {
      userData.sellerProfile = {
        create: {
          level: 1,
          salesThisMonth: 0,
          currentCommission: 0.15,
          monthKey: nowMonth,
        },
      };
    }

    await prisma.user.create({
      data: userData,
    });

    revalidatePath("/settings");
    return { success: `User ${input.name} created.` };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists." };
    }
    console.error(error);
    return { error: "Failed to create user." };
  }
}


