"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { serviceOrdersApi, ServiceOrderDetail } from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/app/components/Toast";

type Status = ServiceOrderDetail["status"];

const STATUS_LABEL: Record<Status, string> = {
  Draft:     "Rascunho",
  Pending:   "Aguardando Pix",
  Paid:      "Pago",
  Cancelled: "Cancelado",
};

const STATUS_CHIP: Record<Status, { bg: string; color: string }> = {
  Draft:     { bg: "var(--s-draft-bg)",     color: "var(--s-draft)"     },
  Pending:   { bg: "var(--s-pending-bg)",   color: "var(--s-pending)"   },
  Paid:      { bg: "var(--s-paid-bg)",      color: "var(--s-paid)"      },
  Cancelled: { bg: "var(--s-cancelled-bg)", color: "var(--s-cancelled)" },
};

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string) =>
  new Date(s).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fieldStyle: React.CSSProperties = {
  padding: "16px 20px",
  background: "var(--surface)",
  borderRadius: 6,
  border: "1px solid var(--rule)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "var(--lead)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14.5,
  fontWeight: 500,
  color: "var(--ink)",
};

function StatusBadge({ status }: { status: Status }) {
  const chip = STATUS_CHIP[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px 4px 8px",
      borderRadius: 99,
      background: chip.bg,
      color: chip.color,
      fontSize: 12,
      fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: chip.color }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

const btnBase: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 4,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  whiteSpace: "nowrap",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionPending, setActionPending] = useState<"pix" | "cancel" | null>(null);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrdersApi.get(id),
    retry: false,
  });

  async function handlePix() {
    if (!order) return;
    setActionPending("pix");
    try {
      const result = await serviceOrdersApi.submitPayment(id);
      toast(`Pix gerado! Valor: ${fmt.format(order.amount)}\n\nCopie o código:\n${result.pixQrCode}`, "success");
      queryClient.invalidateQueries({ queryKey: ["service-order", id] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
    } catch {
      toast("Erro ao gerar cobrança Pix. Tente novamente.", "error");
    } finally {
      setActionPending(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancelar esta ordem de serviço?")) return;
    setActionPending("cancel");
    try {
      await serviceOrdersApi.cancel(id);
      queryClient.invalidateQueries({ queryKey: ["service-order", id] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast("Ordem cancelada com sucesso.", "info");
      router.push("/dashboard");
    } catch {
      toast("Erro ao cancelar. Tente novamente.", "error");
      setActionPending(null);
    }
  }

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--surface)",
        borderBottom: "1px solid var(--rule)",
        padding: "0 16px",
      }}>
        <div style={{
          maxWidth: 680, marginInline: "auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", height: 52,
        }}>
          <Link href="/dashboard" style={{
            fontSize: 13, fontWeight: 500,
            color: "var(--lead)", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ← Voltar
          </Link>
          <span style={{
            fontFamily: "var(--font-brand)", fontSize: 14,
            fontWeight: 700, color: "var(--ink)",
          }}>
            Detalhe da ordem
          </span>
          <div style={{ width: 60 }} />
        </div>
      </nav>

      <main style={{ maxWidth: 680, marginInline: "auto", padding: "32px 16px" }}>
        {isLoading && (
          <p style={{ color: "var(--lead)", fontSize: 14 }}>Carregando...</p>
        )}

        {isError && (
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>
              Ordem não encontrada
            </p>
            <p style={{ fontSize: 13.5, color: "var(--lead)", margin: "0 0 20px" }}>
              Esta ordem não existe ou você não tem acesso a ela.
            </p>
            <Link href="/dashboard" style={{
              display: "inline-block", padding: "8px 18px",
              background: "var(--accent)", color: "#fff",
              borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600,
            }}>
              Voltar ao dashboard
            </Link>
          </div>
        )}

        {order && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{
                    fontFamily: "var(--font-brand)", fontSize: 24,
                    fontWeight: 700, letterSpacing: "-0.02em",
                    margin: "0 0 8px",
                  }}>
                    {order.title}
                  </h1>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 28,
                  fontWeight: 600, color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}>
                  {fmt.format(order.amount)}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {order.description && (
                <div style={fieldStyle}>
                  <div style={labelStyle}>Observações</div>
                  <div style={{ ...valueStyle, lineHeight: 1.6 }}>{order.description}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={fieldStyle}>
                  <div style={labelStyle}>Criado em</div>
                  <div style={{ ...valueStyle, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {fmtDate(order.createdAt)}
                  </div>
                </div>
                <div style={fieldStyle}>
                  <div style={labelStyle}>Atualizado em</div>
                  <div style={{ ...valueStyle, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {fmtDate(order.updatedAt)}
                  </div>
                </div>
              </div>

              <div style={fieldStyle}>
                <div style={labelStyle}>ID da ordem</div>
                <div style={{ ...valueStyle, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--lead)" }}>
                  {order.id}
                </div>
              </div>
            </div>

            {(order.status === "Draft" || order.status === "Pending") && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(order.status === "Draft" || order.status === "Pending") && (
                  <button
                    onClick={handlePix}
                    disabled={actionPending !== null}
                    style={{
                      ...btnBase,
                      background: "var(--accent)",
                      color: "#fff",
                      opacity: actionPending !== null ? 0.65 : 1,
                    }}
                  >
                    {actionPending === "pix" ? "Gerando..." : "Gerar Pix"}
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={actionPending !== null}
                  style={{
                    ...btnBase,
                    background: "transparent",
                    border: "1.5px solid var(--rule)",
                    color: "var(--lead)",
                    opacity: actionPending !== null ? 0.65 : 1,
                  }}
                >
                  {actionPending === "cancel" ? "Cancelando..." : "Cancelar ordem"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
