"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function QuizViewClient({ id }: { id: string }) {
  const { data: quiz, isLoading } = api.quiz.getById.useQuery({ id });

  if (isLoading)
    return (
      <div className="mt-20 p-24 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  if (!quiz)
    return (
      <div className="p-24 text-center text-xl font-bold text-gray-800">
        Questionário não encontrado
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-50 px-4 py-2 font-bold text-indigo-600 transition hover:text-indigo-800"
          >
            ← Voltar ao Dashboard
          </Link>
          <div className="max-w-md truncate font-bold text-indigo-900">
            {quiz.title}
          </div>
        </div>
      </nav>

      <main className="mx-auto mt-8 max-w-6xl p-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
              {quiz.title}
            </h1>
            <p className="inline-block rounded-full bg-gray-100 px-4 py-1.5 font-medium text-gray-500">
              {quiz.responses.length} respostas completadas
            </p>
          </div>
          <div className="w-full rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 md:w-auto md:text-right">
            <p className="mb-2 text-xs font-black tracking-[0.2em] text-indigo-800/50 uppercase">
              Código de Acesso Público
            </p>
            <p className="font-mono text-4xl font-black tracking-widest text-indigo-700 drop-shadow-sm">
              {quiz.accessCode}
            </p>
          </div>
        </div>

        <h2 className="mb-6 pl-2 text-2xl font-black text-gray-800">
          Resultados Recebidos
        </h2>

        {quiz.responses.length === 0 ? (
          <div className="rounded-[2rem] border border-gray-100 bg-white p-20 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
              <svg
                className="h-10 w-10 text-gray-300"
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
            <h3 className="mb-2 text-2xl font-bold text-gray-800">
              Sem Respostas Ainda
            </h3>
            <p className="text-gray-500">
              Compartilhe o código de acesso para começar a receber resultados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-sm">
                    <th className="p-6 text-xs font-bold tracking-wider text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="p-6 text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Respondente
                    </th>
                    <th className="p-6 text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="p-6 text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Recebido Em
                    </th>
                    <th className="p-6 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {quiz.responses.map((resp) => {
                    const answersCount = Object.keys(
                      JSON.parse(resp.answersJson),
                    ).length;
                    return (
                      <tr
                        key={resp.id}
                        className="group transition-colors hover:bg-indigo-50/30"
                      >
                        <td className="p-6 font-mono text-xs font-semibold text-gray-400 group-hover:text-indigo-400">
                          #{resp.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-6 font-bold text-gray-900">
                          {resp.respondentName}
                        </td>
                        <td className="p-6 font-medium text-gray-500">
                          {resp.respondentEmail}
                        </td>
                        <td className="p-6 font-medium text-gray-500">
                          {new Date(resp.submittedAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                            {answersCount} completadas
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
