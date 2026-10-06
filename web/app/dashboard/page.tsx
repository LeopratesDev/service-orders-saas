"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceOrdersApi, ServiceOrder, ListParams } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatsChart from "./StatsChart";
import { useToast } from "@/app/components/Toast";
import QRCode from "qrcode";

const STATUS_LABEL: Record<ServiceOrder["status"], string> = {
  Draft:     "Rascunho",
  Pending:   "Aguardando Pix",
  Paid:      "Pago",
  Cancelled: "Cancelado",
};

const STATUS_CHIP: Record<ServiceOrder["status"], { bg: string; color: string }> = {
  Draft:     { bg: "var(--s-draft-bg)",     color: "var(--s-draft)"     },
  Pending:   { bg: "var(--s-pending-bg)",   color: "var(--s-pending)"   },
  Paid:      { bg: "var(--s-paid-bg)",      color: "var(--s-paid)"      },
  Cancelled: { bg: "var(--s-cancelled-bg)", color: "var(--s-cancelled)" },
};

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ghostBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1.5px solid var(--rule)",
  borderRadius: 4,
  background: "transparent",
  color: "var(--lead)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const smBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 14px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1.5px solid var(--rule)",
  borderRadius: 4,
  background: "var(--surface)",
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  cursor: "pointer",
  outline: "none",
};

function fmtShort(n: number) {
  if (n === 0) return "R$ 0";
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}

function BrandIcon() {
  return (
    <div style={{
      width: 24, height: 24,
      background: "var(--accent)",
      borderRadius: 3,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 2.5,
      padding: 5.5,
      flexShrink: 0,
    }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ background: "#fff", borderRadius: 1, opacity: i === 1 || i === 2 ? 0.5 : 1 }} />
      ))}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--surface)", padding: "14px 18px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--lead)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 500, color: color ?? "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function PixModal({ pixCode, amount, onClose }: { pixCode: string; amount: number; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, pixCode, { width: 200, margin: 1 }).catch(() => {});
    }
  }, [pixCode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Não foi possível copiar. Copie manualmente.", "error");
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: 12,
          padding: "28px 24px",
          maxWidth: 360,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-brand)", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
              Pix gerado
            </div>
            <div style={{ fontSize: 12.5, color: "var(--lead)", marginTop: 2 }}>
              {fmt.format(amount)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--lead)", fontSize: 20, lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>

        <canvas ref={canvasRef} style={{ borderRadius: 8 }} />

        <div style={{ width: "100%", fontSize: 11, color: "var(--lead)", textAlign: "center" }}>
          Ou copie o código abaixo:
        </div>

        <div style={{
          width: "100%",
          background: "var(--bg)",
          border: "1px solid var(--rule)",
          borderRadius: 6,
          padding: "10px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink)",
          wordBreak: "break-all",
          lineHeight: 1.5,
          maxHeight: 80,
          overflowY: "auto",
        }}>
          {pixCode}
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            padding: "10px",
            background: copied ? "var(--s-paid-bg)" : "var(--accent)",
            color: copied ? "var(--s-paid)" : "#fff",
            border: "none",
            borderRadius: 6,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {copied ? "✓ Copiado!" : "Copiar código Pix"}
        </button>
      </div>
    </div>
  );
}

function PixButton({ orderId, amount, onPixGenerated }: { orderId: string; amount: number; onPixGenerated: (code: string) => void }) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function handleClick() {
    setIsPending(true);
    try {
      const result = await serviceOrdersApi.submitPayment(orderId);
      onPixGenerated(result.pixQrCode);
    } catch {
      toast("Erro ao gerar cobrança Pix. Tente novamente.", "error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        padding: "5px 10px",
        border: "1.5px solid var(--rule)",
        borderRadius: 4,
        background: "transparent",
        color: "var(--accent)",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 600,
        cursor: isPending ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        opacity: isPending ? 0.65 : 1,
      }}
    >
      {isPending ? "Gerando..." : "Gerar Pix"}
    </button>
  );
}

function CancelButton({ orderId, onCancelled }: { orderId: string; onCancelled: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function handleClick() {
    if (!confirm("Cancelar esta ordem de serviço?")) return;
    setIsPending(true);
    try {
      await serviceOrdersApi.cancel(orderId);
      onCancelled();
      toast("Ordem cancelada.", "info");
    } catch {
      toast("Erro ao cancelar. Tente novamente.", "error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        padding: "5px 10px",
        border: "1.5px solid var(--rule)",
        borderRadius: 4,
        background: "transparent",
        color: "var(--lead)",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: 500,
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.65 : 1,
        whiteSpace: "nowrap",
      }}
    >
      Cancelar
    </button>
  );
}

function OrderRow({ order, onCancelled, onRefresh }: { order: ServiceOrder; onCancelled: () => void; onRefresh: () => void }) {
  const chip = STATUS_CHIP[order.status];
  const [hover, setHover] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const router = useRouter();

  function handlePixClose() {
    setPixCode(null);
    onRefresh();
  }

  return (
    <>
      {pixCode && (
        <PixModal pixCode={pixCode} amount={order.amount} onClose={handlePixClose} />
      )}
      <tr
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => router.push(`/dashboard/${order.id}`)}
        style={{
          background: hover ? "color-mix(in srgb, var(--accent) 3.5%, var(--surface))" : "var(--surface)",
          cursor: "pointer",
        }}
      >
        <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", verticalAlign: "middle" }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{order.title}</div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--lead)", display: "block", marginTop: 2 }}>
            #{order.id.slice(0, 8)}
          </span>
        </td>
        <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", verticalAlign: "middle", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--lead)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
        </td>
        <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", verticalAlign: "middle" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px 3px 6px",
            borderRadius: 99,
            background: chip.bg,
            color: chip.color,
            fontSize: 11.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: chip.color, flexShrink: 0 }} />
            {STATUS_LABEL[order.status]}
          </span>
        </td>
        <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", verticalAlign: "middle", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: 14, whiteSpace: "nowrap" }}>
          {fmt.format(order.amount)}
        </td>
        <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--rule)", verticalAlign: "middle", textAlign: "right" }}>
          <div
            style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
            onClick={(e) => e.stopPropagation()}
          >
            {order.status === "Draft" && (
              <PixButton orderId={order.id} amount={order.amount} onPixGenerated={setPixCode} />
            )}
            {(order.status === "Draft" || order.status === "Pending") && (
              <CancelButton orderId={order.id} onCancelled={onCancelled} />
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

const PAGE_SIZE = 20;
const ALL_STATUSES = ["Draft", "Pending", "Paid", "Cancelled"] as const;

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filters: ListParams = {
    page,
    pageSize: PAGE_SIZE,
    status: filterStatus || undefined,
    from: filterFrom || undefined,
    to: filterTo ? filterTo + "T23:59:59Z" : undefined,
  };

  const { data: paged, isLoading, isError } = useQuery({
    queryKey: ["service-orders", filters],
    queryFn: () => serviceOrdersApi.list(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ["service-orders-stats"],
    queryFn: () => serviceOrdersApi.stats(),
    staleTime: 30_000,
  });

  const orders = paged?.data;

  const tenantId =
    typeof window !== "undefined" ? (localStorage.getItem("tenantId") ?? "").slice(0, 8) : "";

  const totals = paged
    ? {
        total:   paged.total,
        paid:    stats?.byStatus.find((s) => s.status === "Paid")?.total ?? 0,
        pending: stats?.byStatus.find((s) => s.status === "Pending")?.total ?? 0,
        draft:   stats?.byStatus.find((s) => s.status === "Draft")?.total ?? 0,
      }
    : null;

  function resetPage() { setPage(1); }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    window.location.href = "/login";
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await serviceOrdersApi.exportCsv({
        status: filterStatus || undefined,
        from: filterFrom || undefined,
        to: filterTo ? filterTo + "T23:59:59Z" : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordens-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Erro ao exportar. Tente novamente.", "error");
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = filterStatus || filterFrom || filterTo;

  return (
    <>
      <nav style={{
        position: "sticky",
        top: 0,
        background: "var(--surface)",
        borderBottom: "1px solid var(--rule)",
        zIndex: 10,
        padding: "0 16px",
      }}>
        <div style={{
          maxWidth: 800,
          marginInline: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 52,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrandIcon />
            <span style={{
              fontFamily: "var(--font-brand, 'Syne', sans-serif)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}>
              Ordens de Serviço
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleLogout} style={ghostBtnStyle}>Sair</button>
            <Link href="/dashboard/new" style={smBtnStyle}>+ Nova ordem</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 800, marginInline: "auto", padding: "32px 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "var(--font-brand)",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 2px",
          }}>
            Suas ordens
          </h2>
          {tenantId && (
            <p style={{ fontSize: 12.5, color: "var(--lead)", margin: 0, fontFamily: "var(--font-mono)" }}>
              Tenant · {tenantId}
            </p>
          )}
        </div>

        {totals && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 1,
            background: "var(--rule)",
            border: "1px solid var(--rule)",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 24,
          }}>
            <StatCell label="Total" value={String(totals.total)} />
            <StatCell label="Recebido" value={fmtShort(totals.paid)} color="var(--s-paid)" />
            <StatCell label="Pendente" value={fmtShort(totals.pending)} color="var(--s-pending)" />
            <StatCell label="Rascunho" value={fmtShort(totals.draft)} />
          </div>
        )}

        <StatsChart />

        {/* Filtros + Export */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
            style={inputStyle}
          >
            <option value="">Todos os status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); resetPage(); }}
            style={inputStyle}
            title="De"
          />
          <span style={{ fontSize: 12, color: "var(--lead)" }}>até</span>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); resetPage(); }}
            style={inputStyle}
            title="Até"
          />

          {hasFilters && (
            <button
              onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); resetPage(); }}
              style={{ ...ghostBtnStyle, fontSize: 12, padding: "5px 10px" }}
            >
              Limpar
            </button>
          )}

          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{ ...ghostBtnStyle, opacity: exporting ? 0.65 : 1 }}
            >
              {exporting ? "Exportando..." : "↓ Exportar CSV"}
            </button>
          </div>
        </div>

        {isLoading && <p style={{ color: "var(--lead)", fontSize: 14 }}>Carregando ordens...</p>}
        {isError && <p style={{ color: "#DC2626", fontSize: 14 }}>Erro ao carregar as ordens. Tente novamente.</p>}

        {orders && orders.length === 0 && page === 1 && !hasFilters && (
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "56px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontSize: 17, fontWeight: 600, margin: "0 0 6px" }}>
              Nenhuma ordem criada ainda
            </p>
            <p style={{ fontSize: 13.5, color: "var(--lead)", margin: "0 0 20px" }}>
              Crie sua primeira ordem de serviço para começar a cobrar via Pix.
            </p>
            <Link href="/dashboard/new" style={smBtnStyle}>+ Criar primeira ordem</Link>
          </div>
        )}

        {orders && orders.length === 0 && hasFilters && (
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--lead)", margin: 0 }}>
              Nenhuma ordem encontrada com os filtros aplicados.
            </p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <>
            <div style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {(["Ordem de serviço", "Data", "Status", "Valor", ""] as const).map((h, i) => (
                      <th key={i} style={{
                        padding: "9px 16px",
                        textAlign: i >= 3 ? "right" : "left",
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: "var(--lead)",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        borderBottom: "1px solid var(--rule)",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onCancelled={() => queryClient.invalidateQueries({ queryKey: ["service-orders"] })}
                      onRefresh={() => {
                        queryClient.invalidateQueries({ queryKey: ["service-orders"] });
                        queryClient.invalidateQueries({ queryKey: ["service-orders-stats"] });
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {paged && paged.totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                <span style={{ fontSize: 12.5, color: "var(--lead)" }}>
                  Página {paged.page} de {paged.totalPages} · {paged.total} ordens
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!paged.hasPrevious}
                    style={{ ...ghostBtnStyle, opacity: paged.hasPrevious ? 1 : 0.4, cursor: paged.hasPrevious ? "pointer" : "default" }}
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!paged.hasNext}
                    style={{ ...ghostBtnStyle, opacity: paged.hasNext ? 1 : 0.4, cursor: paged.hasNext ? "pointer" : "default" }}
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
