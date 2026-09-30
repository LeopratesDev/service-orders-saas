"use client";

import { useQuery } from "@tanstack/react-query";
import { serviceOrdersApi, ServiceOrder } from "@/lib/api";

const STATUS_COLORS: Record<ServiceOrder["status"], string> = {
  Draft: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["service-orders"],
    queryFn: serviceOrdersApi.list,
  });

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Ordens de Serviço</h1>
        <a
          href="/dashboard/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Nova Ordem
        </a>
      </div>

      {isLoading && <p className="text-gray-500">Carregando...</p>}
      {isError && <p className="text-red-500">Erro ao carregar as ordens.</p>}

      {orders && orders.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Nenhuma ordem criada ainda.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition">
            <div>
              <p className="font-medium text-gray-900">{order.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
              <span className="font-semibold text-gray-800">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
