"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "admin@empresa.com",
    password: "demo123",
    tenantId: crypto.randomUUID(),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const proxyBase =
        typeof window !== "undefined" && window.location.hostname !== "localhost"
          ? "/api/proxy"
          : "";
      const { data } = await axios.post(`${proxyBase}/api/auth/login`, form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenantId", data.tenantId);
      router.push("/dashboard");
    } catch {
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 16px",
      background: "var(--bg)",
    }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <BrandIcon size={32} />
          <span style={{
            fontFamily: "var(--font-brand, 'Syne', sans-serif)",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}>
            Ordens de Serviço
          </span>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--lead)", margin: 0 }}>
          Gerencie seus trabalhos e receba via Pix
        </p>
      </div>

      {/* Form card */}
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        borderRadius: 8,
        padding: "28px 28px 24px",
      }}>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </FormGroup>

          <FormGroup label="Senha">
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />
          </FormGroup>

          <FormGroup
            label="ID da Empresa"
            hint="Cada login cria um ambiente isolado para sua empresa"
            labelSuffix="— gerado automaticamente"
          >
            <input
              readOnly
              value={form.tenantId}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--lead)" }}
            />
          </FormGroup>

          {error && (
            <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 20px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.65 : 1,
              letterSpacing: "0.01em",
              marginTop: 4,
            }}
          >
            {loading ? "Entrando..." : "Entrar no sistema"}
          </button>
        </form>
      </div>

      <p style={{
        marginTop: 16,
        padding: "10px 14px",
        background: "var(--accent-dim)",
        borderRadius: 4,
        fontSize: 12,
        color: "var(--lead)",
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 380,
        width: "100%",
      }}>
        Demo: qualquer email e senha funcionam.<br />
        Um tenant isolado é criado a cada login.
      </p>
    </main>
  );
}

function FormGroup({
  label,
  labelSuffix,
  hint,
  children,
}: {
  label: string;
  labelSuffix?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 5, letterSpacing: "0.01em" }}>
        {label}
        {labelSuffix && (
          <span style={{ fontWeight: 400, color: "var(--lead)", marginLeft: 4, fontSize: 12 }}>
            {labelSuffix}
          </span>
        )}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "var(--lead)", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
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

function BrandIcon({ size = 32 }: { size?: number }) {
  const gap = size * 0.09;
  const pad = size * 0.22;
  return (
    <div style={{
      width: size,
      height: size,
      background: "var(--accent)",
      borderRadius: 4,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap,
      padding: pad,
      flexShrink: 0,
    }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{
          background: "#fff",
          borderRadius: 1,
          opacity: i === 1 || i === 2 ? 0.5 : 1,
        }} />
      ))}
    </div>
  );
}
