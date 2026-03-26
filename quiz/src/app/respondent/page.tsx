"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function RespondentLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = api.quiz.verifyAccessCode.useMutation({
    onSuccess: (quiz) => {
      // Store user details in localStorage so the next page can use it
      localStorage.setItem(
        "respondentData",
        JSON.stringify({ name, email, accessCode }),
      );
      router.push(`/respondent/quiz/${quiz.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ accessCode });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-md rounded-[2.5rem] border border-emerald-100 bg-white p-10 shadow-2xl shadow-emerald-900/10">
        <Link
          href="/"
          className="mt-2 mb-8 inline-block font-bold text-emerald-600 transition-all hover:-translate-x-1 hover:text-emerald-800"
        >
          ← Voltar ao Início
        </Link>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-emerald-100/50 bg-emerald-50 shadow-inner">
            <svg
              className="h-10 w-10 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Aluno
          </h1>
          <p className="mt-2 font-medium text-emerald-600/80">
            Acesso de Participante
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100/50 bg-red-50 p-4 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 ml-1 block text-sm font-bold text-gray-700">
              Seu Nome
            </label>
            <input
              type="text"
              required
              className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 py-4 text-lg font-medium text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-hidden"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 ml-1 block text-sm font-bold text-gray-700">
              Seu Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 py-4 text-lg font-medium text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-hidden"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <label className="mb-2 ml-1 block text-sm font-black tracking-wider text-emerald-800 uppercase">
              Código Privado
            </label>
            <input
              type="text"
              required
              maxLength={6}
              className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 px-5 py-5 text-center font-mono text-3xl font-black tracking-[0.2em] text-emerald-900 uppercase placeholder-emerald-200 transition focus:border-emerald-500 focus:bg-white focus:outline-hidden"
              placeholder="XXXXXX"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            />
          </div>
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="mt-6 w-full rounded-2xl bg-emerald-500 py-5 text-lg font-black text-white shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {verifyMutation.isPending ? "Validando Acesso..." : "Iniciar Teste"}
          </button>
        </form>
      </div>
    </main>
  );
}
