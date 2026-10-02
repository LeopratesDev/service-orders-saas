"use client";

import { useQuery } from "@tanstack/react-query";
import { serviceOrdersApi, ServiceOrderStatItem } from "@/lib/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const STATUS_LABEL: Record<string, string> = {
  Draft:     "Rascunho",
  Pending:   "Aguard. Pix",
  Paid:      "Pago",
  Cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  Draft:     "var(--s-draft)",
  Pending:   "var(--s-pending)",
  Paid:      "var(--s-paid)",
  Cancelled: "var(--s-cancelled)",
};

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function CustomTooltipCount({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--rule)",
      borderRadius: 6, padding: "8px 12px", fontSize: 12,
    }}>
      <div style={{ fontWeight: 600 }}>{STATUS_LABEL[payload[0].name] ?? payload[0].name}</div>
      <div style={{ color: "var(--lead)" }}>{payload[0].value} {payload[0].value === 1 ? "ordem" : "ordens"}</div>
    </div>
  );
}

function CustomTooltipValue({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--rule)",
      borderRadius: 6, padding: "8px 12px", fontSize: 12,
    }}>
      <div style={{ fontWeight: 600 }}>{STATUS_LABEL[label ?? ""] ?? label}</div>
      <div style={{ color: "var(--lead)" }}>{fmt.format(payload[0].value)}</div>
    </div>
  );
}

export default function StatsChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["service-orders-stats"],
    queryFn: () => serviceOrdersApi.stats(),
    staleTime: 30_000,
  });

  if (isLoading || !data?.byStatus?.length) return null;

  const chartData = data.byStatus.map((item: ServiceOrderStatItem) => ({
    name: item.status,
    label: STATUS_LABEL[item.status] ?? item.status,
    count: item.count,
    total: item.total,
    color: STATUS_COLOR[item.status] ?? "var(--lead)",
  }));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 1,
      background: "var(--rule)",
      border: "1px solid var(--rule)",
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 24,
    }}>
      {/* Donut — contagem por status */}
      <div style={{ background: "var(--surface)", padding: "16px 20px" }}>
        <div style={{
          fontSize: 10.5, fontWeight: 600, color: "var(--lead)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12,
        }}>
          Ordens por status
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipCount />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {chartData.map((entry) => (
              <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
                <span style={{ color: "var(--lead)", flex: 1 }}>{entry.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar — valor total por status */}
      <div style={{ background: "var(--surface)", padding: "16px 20px" }}>
        <div style={{
          fontSize: 10.5, fontWeight: 600, color: "var(--lead)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12,
        }}>
          Valor total por status
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={chartData} barSize={18} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--rule)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--lead)", fontFamily: "inherit" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tickFormatter={(v: number) => {
                if (v === 0) return "0";
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return String(v);
              }}
              tick={{ fontSize: 9, fill: "var(--lead)", fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltipValue />} cursor={{ fill: "color-mix(in srgb, var(--accent) 6%, transparent)" }} />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
