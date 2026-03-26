"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function TakeQuiz() {
  const router = useRouter();
  const [respondent, setRespondent] = useState<{
    name: string;
    email: string;
    accessCode: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("respondentData");
    if (!data) {
      router.push("/respondent");
    } else {
      setRespondent(
        JSON.parse(data) as {
          name: string;
          email: string;
          accessCode: string;
        },
      );
    }
  }, [router]);

  const {
    data: quiz,
    isLoading,
    error,
  } = api.quiz.getQuizByAccessCode.useQuery(
    { accessCode: respondent?.accessCode ?? "" },
    { enabled: !!respondent?.accessCode, retry: false },
  );

  const submitMutation = api.response.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  if (!respondent) return null;
  if (isLoading)
    return (
      <div className="mt-20 p-24 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  if (error || !quiz)
    return (
      <div className="mt-20 p-24 text-center font-bold text-red-600">
        {error?.message ?? "Erro ao carregar questionário"}
      </div>
    );

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 to-teal-100 p-4">
        <div className="w-full max-w-md rounded-[2.5rem] border border-emerald-100 bg-white p-12 text-center shadow-2xl shadow-emerald-900/10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-12 w-12 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-gray-900">
            Enviado!
          </h2>
          <p className="mb-8 font-medium text-emerald-700/80">
            Suas respostas foram registradas com sucesso.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("respondentData");
              router.push("/");
            }}
            className="w-full rounded-2xl bg-emerald-600 px-8 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-1 hover:bg-emerald-700"
          >
            Voltar ao Início
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      quizId: quiz.id,
      respondentName: respondent.name,
      respondentEmail: respondent.email,
      answers,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 selection:bg-emerald-200">
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="font-black tracking-tight text-emerald-800">
            Candidato:{" "}
            <span className="ml-1 font-medium text-gray-600">
              {respondent.name}
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm("Sair agora perderá seu progresso. Continuar?")) {
                localStorage.removeItem("respondentData");
                router.push("/respondent");
              }
            }}
            className="text-sm font-bold text-gray-400 transition hover:text-red-500"
          >
            Sair do Teste
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-8 max-w-4xl p-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="mx-auto max-w-2xl text-lg font-medium text-gray-500">
              {quiz.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {quiz.questions.map((q: any, qIndex: number) => (
            <div
              key={qIndex}
              className="group rounded-3xl border border-gray-100 bg-white p-8 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 hover:border-emerald-100 hover:shadow-xl sm:p-10"
            >
              <h3 className="mb-8 flex gap-4 text-2xl leading-relaxed font-bold text-gray-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-700 shadow-inner">
                  {qIndex + 1}
                </span>
                {q.text}
              </h3>
              <div className="ml-2 space-y-3 sm:ml-14">
                {q.options.map((opt: string, optIndex: number) => (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-all duration-200 ${
                      answers[qIndex.toString()] === opt
                        ? "border-emerald-500 bg-emerald-50/80 shadow-inner"
                        : "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={opt}
                      required
                      checked={answers[qIndex.toString()] === opt}
                      onChange={() =>
                        setAnswers({ ...answers, [qIndex.toString()]: opt })
                      }
                      className="h-6 w-6 border-gray-300 text-emerald-600 transition focus:ring-emerald-500"
                    />
                    <span
                      className={`text-lg font-semibold transition-colors select-none ${
                        answers[qIndex.toString()] === opt
                          ? "text-emerald-900"
                          : "text-gray-700"
                      }`}
                    >
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 flex justify-end">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full rounded-2xl bg-emerald-600 px-14 py-6 text-xl font-black text-white shadow-2xl shadow-emerald-200 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
            >
              {submitMutation.isPending
                ? "Processando..."
                : "Finalizar e Enviar Teste"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
