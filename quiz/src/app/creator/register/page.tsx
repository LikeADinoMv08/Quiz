"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = api.auth.register.useMutation({
    onSuccess: () => {
      router.push("/creator/login");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)
      return setError("Senha deve ter no mínimo 6 caracteres");
    if (password !== confirmPassword) return setError("Senhas não coincidem");

    registerMutation.mutate({ name, email, password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Link
          href="/creator/login"
          className="mb-6 inline-block font-medium text-purple-600 hover:text-purple-800"
        >
          ← Voltar
        </Link>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-10 w-10 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-lg border px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Senha (min 6)
            </label>
            <input
              type="password"
              required
              className="w-full rounded-lg border px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirmar Senha
            </label>
            <input
              type="password"
              required
              className="w-full rounded-lg border px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {registerMutation.isPending ? "Criando..." : "Criar Conta"}
          </button>
        </form>
      </div>
    </main>
  );
}
