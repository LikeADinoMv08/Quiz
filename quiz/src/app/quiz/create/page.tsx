"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([{ text: "", options: ["", ""] }]);

  const createMutation = api.quiz.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", ""] }]);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQs = [...questions];
    if (newQs[index]) newQs[index].text = text;
    setQuestions(newQs);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    if (newQs[qIndex]) newQs[qIndex].options.push("");
    setQuestions(newQs);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const newQs = [...questions];
    if (newQs[qIndex]) newQs[qIndex].options[optIndex] = text;
    setQuestions(newQs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
      questions,
      active: true,
      allowLateSubmissions: false,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 to-white pb-20 text-gray-900">
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-indigo-900">
            Novo Questionário
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            Cancelar
          </Link>
        </div>
      </nav>

      <main className="mx-auto mt-8 max-w-4xl p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
            <h2 className="mb-6 text-xl font-bold text-indigo-900">
              Informações Básicas
            </h2>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prova de Matemática"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-lg transition focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Descrição (Opcional)
                </label>
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 transition focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Instruções ou detalhes sobre o questionário..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="px-2 text-xl font-bold text-indigo-900">
              Perguntas
            </h2>
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="group relative rounded-3xl border border-gray-100 bg-white p-8 shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-700">
                    {qIndex + 1}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Sua pergunta aqui..."
                    className="w-full flex-1 border-b-2 border-dashed border-gray-300 bg-transparent px-2 py-2 text-xl font-medium placeholder-gray-300 transition focus:border-indigo-500 focus:outline-hidden"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  />
                </div>

                <div className="ml-14 space-y-3">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3">
                      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 transition group-hover:border-indigo-300"></div>
                      <input
                        type="text"
                        required
                        placeholder={`Opção ${optIndex + 1}`}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 transition focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(qIndex, optIndex, e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="mt-3 ml-8 flex items-center gap-1 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
                  >
                    + Adicionar Opção
                  </button>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions(questions.filter((_, i) => i !== qIndex))
                    }
                    className="absolute -top-3 -right-3 hidden h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition group-hover:flex hover:bg-red-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-2 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={addQuestion}
              className="w-full rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50 px-8 py-4 font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 sm:w-auto"
            >
              + Nova Pergunta
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-2xl bg-indigo-600 px-12 py-4 font-black text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-1 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
            >
              {createMutation.isPending ? "Salvando..." : "Publicar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
