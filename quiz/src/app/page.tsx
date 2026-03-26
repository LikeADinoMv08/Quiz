import Link from "next/link";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="animate-fade-in-up space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/30 bg-indigo-500/20 shadow-lg backdrop-blur-sm">
            <svg
              className="h-12 w-12 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="bg-linear-to-r from-indigo-300 to-purple-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-6xl">
            Sistema de Questionários
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-light text-indigo-200/80">
            Plataforma completa, moderna e dinâmica para criação e gerenciamento
            de questionários.
          </p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          <Link
            className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/10"
            href={session ? "/dashboard" : "/creator/login"}
          >
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 transform p-6 opacity-10 transition-all duration-500 group-hover:scale-110 group-hover:opacity-20">
              <svg
                className="h-32 w-32"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-indigo-300">Criador</h3>
            <div className="flex-1 text-lg text-indigo-100/70">
              {session
                ? "Ir para o Dashboard →"
                : "Crie seus questionários, analise resultados e gerencie acessos."}
            </div>
          </Link>

          <Link
            className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/10"
            href="/respondent"
          >
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 transform p-6 opacity-10 transition-all duration-500 group-hover:scale-110 group-hover:opacity-20">
              <svg
                className="h-32 w-32"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-emerald-300">Respondente</h3>
            <div className="flex-1 text-lg text-emerald-100/70">
              Insira o código de acesso e responda aos questionários.
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
