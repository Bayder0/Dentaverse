import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BucketSeed = {
  key: string;
  label: string;
  description?: string;
  defaultShare?: number;
  children?: BucketSeed[];
};

const bucketTree: BucketSeed[] = [
  {
    key: "ownership",
    label: "Ownership & Retained Profits",
    defaultShare: 0.3,
    children: [
      { key: "owners", label: "Owners", defaultShare: 0.6 },
      { key: "retained", label: "Retained Profits", defaultShare: 0.4 },
    ],
  },
  {
    key: "team",
    label: "Team",
    defaultShare: 0.4,
    children: [
      { key: "team_lecturers", label: "Lecturers", defaultShare: 0.34 },
      { key: "team_powerpoint", label: "PowerPoint Designers", defaultShare: 0.3 },
      { key: "team_social", label: "Social Media Managers", defaultShare: 0.15 },
      { key: "team_mcq", label: "MCQ Team", defaultShare: 0.1 },
      { key: "team_admins", label: "Admins", defaultShare: 0.11 },
    ],
  },
  {
    key: "academy",
    label: "Academy",
    defaultShare: 0.3,
    children: [
      { key: "academy_influencers", label: "Influencers & Partnerships", defaultShare: 0.267 },
      { key: "academy_dev", label: "New Courses & Content Development", defaultShare: 0.233 },
      { key: "academy_rewards", label: "Rewards & Bonuses", defaultShare: 0.167 },
      { key: "academy_ads", label: "Paid Advertisements", defaultShare: 0.333 },
    ],
  },
];

const sellerLevels = [
  { level: 1, minSales: 0, maxSales: 9, commissionRate: 0.15 },
  { level: 2, minSales: 10, maxSales: 19, commissionRate: 0.2 },
  { level: 3, minSales: 20, maxSales: 39, commissionRate: 0.25 },
  { level: 4, minSales: 40, maxSales: null, commissionRate: 0.33 },
];

const discounts = [
  { name: "No Discount", type: "FLAT", amount: 0 },
  { name: "5 Friends Discount", type: "FLAT", amount: 10000 },
  { name: "Black Friday", type: "FLAT", amount: 8000 },
];

async function upsertBucket(seed: BucketSeed, parentId?: string) {
  const bucket = await prisma.fundBucket.upsert({
    where: { key: seed.key },
    update: {
      label: seed.label,
      description: seed.description,
      parentId,
      defaultShare: seed.defaultShare ?? null,
    },
    create: {
      key: seed.key,
      label: seed.label,
      description: seed.description,
      parentId,
      defaultShare: seed.defaultShare ?? null,
    },
  });

  if (seed.children) {
    for (const child of seed.children) {
      await upsertBucket(child, bucket.id);
    }
  }

  return bucket;
}

function toDecimal(value: number) {
  return value;
}

async function main() {
  for (const level of sellerLevels) {
    await prisma.sellerLevelRule.upsert({
      where: { level: level.level },
      update: {
        minSales: level.minSales,
        maxSales: level.maxSales,
        commissionRate: level.commissionRate,
      },
      create: level,
    });
  }

  for (const bucket of bucketTree) {
    await upsertBucket(bucket);
  }

  for (const discount of discounts) {
    await prisma.discount.upsert({
      where: { name: discount.name },
      update: { amount: discount.amount },
      create: {
        name: discount.name,
        amount: discount.amount,
        type: discount.type === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      },
    });
  }

  const ministerialTemplate = await prisma.distributionTemplate.upsert({
    where: { name: "Ministerial Default" },
    update: {},
    create: {
      name: "Ministerial Default",
      description: "Default split for ministerial courses",
      applicableTo: "MINISTERIAL",
    },
  });

  const summerTemplate = await prisma.distributionTemplate.upsert({
    where: { name: "Summer Default" },
    update: {},
    create: {
      name: "Summer Default",
      description: "Default split for summer training",
      applicableTo: "SUMMER",
    },
  });

  const existingBuckets = await prisma.fundBucket.findMany();
  const bucketMap: Record<string, string> = {};
  for (const bucket of existingBuckets) {
    bucketMap[bucket.key] = bucket.id;
  }

  const createSlices = async (
    templateId: string,
    allocations: Array<{ key: string; percentage: number }>
  ) => {
    await prisma.distributionSlice.deleteMany({
      where: { templateId },
    });

    for (const allocation of allocations) {
      if (!bucketMap[allocation.key]) continue;
      await prisma.distributionSlice.create({
        data: {
          templateId,
          bucketId: bucketMap[allocation.key],
          percentage: toDecimal(allocation.percentage),
        },
      });
    }
  };

  // Ministerial: Ownership 30% (Owners 60% = 18%, Retained 40% = 12%)
  // Team 40% (Lecturers 34% = 13.6%, PowerPoint 30% = 12%, Social 15% = 6%, MCQ 10% = 4%, Admins 11% = 4.4%)
  // Academy 30% (Influencers 26.7% = 8.01%, New Courses 23.3% = 6.99%, Rewards 16.7% = 5.01%, Ads 33.3% = 9.99%)
  await createSlices(ministerialTemplate.id, [
    { key: "owners", percentage: 0.18 },
    { key: "retained", percentage: 0.12 },
    { key: "team_lecturers", percentage: 0.136 },
    { key: "team_powerpoint", percentage: 0.12 },
    { key: "team_social", percentage: 0.06 },
    { key: "team_mcq", percentage: 0.04 },
    { key: "team_admins", percentage: 0.044 },
    { key: "academy_influencers", percentage: 0.0801 },
    { key: "academy_dev", percentage: 0.0699 },
    { key: "academy_rewards", percentage: 0.0501 },
    { key: "academy_ads", percentage: 0.0999 },
  ]);

  // Summer: Ownership 50% (Owners 60% = 30%, Retained 40% = 20%)
  // Academy 50% (Influencers 26.7% = 13.35%, New Courses 23.3% = 11.65%, Rewards 16.7% = 8.35%, Ads 33.3% = 16.65%)
  await createSlices(summerTemplate.id, [
    { key: "owners", percentage: 0.3 },
    { key: "retained", percentage: 0.2 },
    { key: "academy_influencers", percentage: 0.1335 },
    { key: "academy_dev", percentage: 0.1165 },
    { key: "academy_rewards", percentage: 0.0835 },
    { key: "academy_ads", percentage: 0.1665 },
  ]);

  const courses = [
    {
      name: "Ministerial Stage 3",
      type: "MINISTERIAL",
      stage: 3,
      basePrice: 50000,
      customDistributionId: ministerialTemplate.id,
    },
    {
      name: "Ministerial Stage 4",
      type: "MINISTERIAL",
      stage: 4,
      basePrice: 55000,
      customDistributionId: ministerialTemplate.id,
    },
    {
      name: "Ministerial Stage 5",
      type: "MINISTERIAL",
      stage: 5,
      basePrice: 60000,
      customDistributionId: ministerialTemplate.id,
    },
    {
      name: "Summer Training Intensive",
      type: "SUMMER",
      basePrice: 70000,
      customDistributionId: summerTemplate.id,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { name: course.name },
      update: {
        basePrice: course.basePrice,
        customDistributionId: course.customDistributionId,
      },
      create: course,
    });
  }

  // Create bayder owner account
  const bayderEmail = "baydershghl@gmail.com";
  const bayderPassword = "bayder2025";
  const hashedBayderPassword = await bcrypt.hash(bayderPassword, 10);

  await prisma.user.upsert({
    where: { email: bayderEmail },
    update: {
      name: "bayder",
      role: "OWNER",
      hashedPassword: hashedBayderPassword,
      plainPassword: bayderPassword,
    },
    create: {
      email: bayderEmail,
      name: "bayder",
      role: "OWNER",
      hashedPassword: hashedBayderPassword,
      plainPassword: bayderPassword,
    },
  });

  // Also create the default owner account for backward compatibility
  const ownerEmail = "owner@dentaverse.com";
  const ownerPassword = "dentaverse2024";
  const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: "DentaVerse Owner",
      role: "OWNER",
      hashedPassword: hashedOwnerPassword,
      plainPassword: ownerPassword,
    },
    create: {
      email: ownerEmail,
      name: "DentaVerse Owner",
      role: "OWNER",
      hashedPassword: hashedOwnerPassword,
      plainPassword: ownerPassword,
    },
  });

  const adminEmail = "admin@dentaverse.com";
  const adminPassword = "admin2024";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "DentaVerse Admin",
      role: "ADMIN",
      hashedPassword: hashedAdminPassword,
      plainPassword: adminPassword,
    },
    create: {
      email: adminEmail,
      name: "DentaVerse Admin",
      role: "ADMIN",
      hashedPassword: hashedAdminPassword,
      plainPassword: adminPassword,
    },
  });

  console.log("Seed data applied successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

