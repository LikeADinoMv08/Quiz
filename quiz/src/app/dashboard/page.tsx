import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import DashboardClient from "./_components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/creator/login");
  }

  return <DashboardClient />;
}
