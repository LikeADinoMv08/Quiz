"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export default function DashboardClient() {
  const utils = api.useUtils();
  const { data: quizzes, isLoading } = api.quiz.getAllByCreator.useQuery();

  const { data: session } = useSession();

  const toggleMutation = api.quiz.toggleActive.useMutation({
    onSuccess: () => utils.quiz.getAllByCreator.invalidate(),
  });

  const deleteMutation = api.quiz.delete.useMutation({
    onSuccess: () => utils.quiz.getAllByCreator.invalidate(),
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-indigo-300">
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-indigo-600 transition hover:text-indigo-800"
          >
            Mesa de Criação
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-gray-500 md:inline-block">
              Olá, {session?.user?.name}
            </span>
            <Link
              href="/quiz/create"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
            >
              + Novo App
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-6">
        <h2 className="mb-8 text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          Meus Questionários
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-sm"></div>
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group flex transform flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="line-clamp-1 text-2xl font-bold">
                    {quiz.title}
                  </h3>
                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${
                      quiz.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {quiz.active ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <p className="mb-6 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
                  {quiz.description ?? "Sem descrição"}
                </p>
                <div className="mb-6 rounded-2xl border border-indigo-100/50 bg-linear-to-br from-indigo-50 to-purple-50 p-5">
                  <p className="mb-1 text-xs font-bold tracking-widest text-indigo-900/40 uppercase">
                    Acesso
                  </p>
                  <p className="font-mono text-3xl font-black tracking-[0.2em] text-indigo-700">
                    {quiz.accessCode}
                  </p>
                </div>
                <div className="mt-auto flex gap-3">
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Resultados
                  </Link>
                  <button
                    onClick={() => toggleMutation.mutate({ id: quiz.id })}
                    disabled={toggleMutation.isPending}
                    title={quiz.active ? "Pausar" : "Ativar"}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                  >
                    {quiz.active ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir?")) {
                        deleteMutation.mutate({ id: quiz.id });
                      }
                    }}
                    title="Excluir"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-20 text-center shadow-sm">
            <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-4xl bg-indigo-50 shadow-inner">
              <svg
                className="h-14 w-14 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900">
              Câmera... Ação!
            </h3>
            <p className="mx-auto mb-8 max-w-md text-lg font-medium text-gray-500">
              Parece que você ainda não tem nada publicado. Crie seu primeiro
              questionário e compartilhe com o mundo.
            </p>
            <Link
              href="/quiz/create"
              className="inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-10 py-5 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700"
            >
              <span>Criar Agora</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
