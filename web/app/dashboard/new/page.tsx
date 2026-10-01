"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceOrdersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", amount: "" });

  const mutation = useMutation({
    mutationFn: () =>
      serviceOrdersApi.create({
        title: form.title,
        description: form.description || null,
        amount: parseFloat(form.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      router.push("/dashboard");
    },
  });

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    window.location.href = "/login";
  }

  return (
    <>
      {/* Nav */}
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
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--ink)" }}>
            <BrandIcon />
            <span style={{
              fontFamily: "var(--font-brand, 'Syne', sans-serif)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}>
              Ordens de Serviço
            </span>
          </Link>
          <button onClick={handleLogout} style={ghostBtnStyle}>Sair</button>
        </div>
      </nav>

      <main style={{ maxWidth: 560, marginInline: "auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-brand)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 4px", textWrap: "balance" as any }}>
            Nova ordem de serviço
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--lead)", margin: 0 }}>
            Criada como rascunho. Confirme para gerar a cobrança Pix.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FormGroup label="Descrição do serviço">
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Instalação de 4 tomadas embutidas"
                style={inputStyle}
              />
            </FormGroup>

            <FormGroup label="Observações" optional>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Material necessário, endereço do cliente, prazo..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 84 }}
              />
            </FormGroup>

            <FormGroup label="Valor do serviço">
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--lead)",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "var(--font-mono)",
                  pointerEvents: "none",
                }}>
                  R$
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  style={{ ...inputStyle, paddingLeft: 34, fontFamily: "var(--font-mono)" }}
                />
              </div>
            </FormGroup>

            {/* Pix note */}
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: "var(--accent-dim)",
              borderRadius: 4,
              padding: "11px 13px",
              fontSize: 13,
              color: "var(--accent)",
              lineHeight: 1.45,
            }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.5 6.5v4M7.5 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>
                Depois de criar a ordem, você gera um Pix para enviar ao cliente. O status muda para{" "}
                <strong>Pago</strong> após a confirmação.
              </span>
            </div>

            {mutation.isError && (
              <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>
                Erro ao criar a ordem. Tente novamente.
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 2 }}>
              <Link href="/dashboard" style={cancelBtnStyle}>Cancelar</Link>
              <button
                type="submit"
                disabled={mutation.isPending}
                style={{
                  padding: "9px 22px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: mutation.isPending ? "not-allowed" : "pointer",
                  opacity: mutation.isPending ? 0.65 : 1,
                }}
              >
                {mutation.isPending ? "Criando..." : "Criar ordem"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function FormGroup({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 5, letterSpacing: "0.01em" }}>
        {label}
        {optional && (
          <span style={{ fontWeight: 400, color: "var(--lead)", marginLeft: 4, fontSize: 12 }}>opcional</span>
        )}
      </label>
      {children}
    </div>
  );
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid var(--rule)",
  borderRadius: 4,
  background: "var(--bg)",
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
};

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

const cancelBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  border: "1.5px solid var(--rule)",
  borderRadius: 4,
  background: "transparent",
  color: "var(--lead)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
};
