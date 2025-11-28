import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authConfig);
  redirect(session ? "/dashboard" : "/login");
}
