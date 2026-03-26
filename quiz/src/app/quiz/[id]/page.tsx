import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import QuizViewClient from "./_components/QuizViewClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/creator/login");

  const { id } = await params;
  return <QuizViewClient id={id} />;
}
