import { prisma } from "./prisma";

export type BucketNode = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  parentId: string | null;
  defaultShare: number | null;
  children: BucketNode[];
  inflow: number;
  used: number;
  remaining: number;
};

type GroupSum = Record<string, number>;

async function groupSum<T extends { bucketId: string; _sum: { amount: unknown } }>(
  rows: T[]
) {
  return rows.reduce<GroupSum>((acc, row) => {
    acc[row.bucketId] = Number(row._sum.amount ?? 0) + (acc[row.bucketId] ?? 0);
    return acc;
  }, {});
}

export async function getBucketTree(monthKeys?: string[]) {
  const [buckets, allInflowRows, allExpenseRows, allSalaryRows] = await Promise.all([
    prisma.fundBucket.findMany({
      orderBy: { label: "asc" },
    }),
    prisma.saleDistribution.findMany({
      include: { sale: { select: { monthKey: true } } },
    }),
    prisma.expense.findMany({
      select: { bucketId: true, amount: true, monthKey: true },
    }),
    prisma.salaryPayment.findMany({
      select: { bucketId: true, amount: true },
    }),
  ]);

  // Filter by month keys if provided
  let inflowRows = allInflowRows;
  let expenseRows = allExpenseRows;
  
  if (monthKeys && monthKeys.length > 0) {
    inflowRows = allInflowRows.filter((dist) => 
      monthKeys.includes(dist.sale.monthKey)
    );
    expenseRows = allExpenseRows.filter((exp) => 
      monthKeys.includes(exp.monthKey)
    );
  }

  // Group the filtered data
  const inflowMap: GroupSum = {};
  for (const dist of inflowRows) {
    inflowMap[dist.bucketId] = (inflowMap[dist.bucketId] ?? 0) + Number(dist.amount);
  }

  const expenseMap: GroupSum = {};
  for (const exp of expenseRows) {
    expenseMap[exp.bucketId] = (expenseMap[exp.bucketId] ?? 0) + Number(exp.amount);
  }

  const salaryMap: GroupSum = {};
  for (const salary of allSalaryRows) {
    salaryMap[salary.bucketId] = (salaryMap[salary.bucketId] ?? 0) + Number(salary.amount);
  }


  const nodeMap = new Map<string, BucketNode>();

  for (const bucket of buckets) {
    nodeMap.set(bucket.id, {
      id: bucket.id,
      key: bucket.key,
      label: bucket.label,
      description: bucket.description,
      parentId: bucket.parentId,
      defaultShare: bucket.defaultShare ? Number(bucket.defaultShare) : null,
      children: [],
      inflow: Number(inflowMap[bucket.id] ?? 0),
      used: Number((expenseMap[bucket.id] ?? 0) + (salaryMap[bucket.id] ?? 0)),
      remaining: 0,
    });
  }

  const roots: BucketNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const aggregate = (node: BucketNode): { inflow: number; used: number } => {
    const childAggregate = node.children.map(aggregate);
    const childInflow = childAggregate.reduce((sum, item) => sum + item.inflow, 0);
    const childUsed = childAggregate.reduce((sum, item) => sum + item.used, 0);

    const totalInflow = node.inflow + childInflow;
    const totalUsed = node.used + childUsed;
    node.inflow = totalInflow;
    node.used = totalUsed;
    node.remaining = totalInflow - totalUsed;

    return { inflow: totalInflow, used: totalUsed };
  };

  for (const root of roots) {
    aggregate(root);
  }

  return roots;
}

export async function getBucketSummary() {
  const tree = await getBucketTree();

  const flatten = (nodes: BucketNode[], acc: BucketNode[] = []) => {
    for (const node of nodes) {
      acc.push(node);
      flatten(node.children, acc);
    }
    return acc;
  };

  return flatten(tree);
}


