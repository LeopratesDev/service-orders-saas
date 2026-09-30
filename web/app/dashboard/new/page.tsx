"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceOrdersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", amount: "" });

  const mutation = useMutation({
    mutationFn: () =>
      serviceOrdersApi.create({
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      router.push("/dashboard");
    },
  });

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Nova Ordem de Serviço</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Troca de compressor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            required
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descreva o serviço..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="1500.00"
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">Erro ao criar a ordem. Tente novamente.</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {mutation.isPending ? "Criando..." : "Criar Ordem"}
        </button>
      </form>
    </main>
  );
}
