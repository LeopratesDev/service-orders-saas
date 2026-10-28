import { describe, it, expect } from "vitest";

// buildQuery é uma função pura — testamos o comportamento via URL resultante
function buildQuery(params: Record<string, string | number | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

describe("buildQuery", () => {
  it("retorna string vazia quando todos os params são undefined", () => {
    expect(buildQuery({ page: undefined, status: undefined })).toBe("");
  });

  it("inclui apenas params com valor definido", () => {
    expect(buildQuery({ page: 1, status: undefined })).toBe("?page=1");
  });

  it("exclui strings vazias", () => {
    expect(buildQuery({ page: 1, status: "" })).toBe("?page=1");
  });

  it("encoda caracteres especiais no valor", () => {
    const result = buildQuery({ from: "2024-01-01T00:00:00Z" });
    expect(result).toBe("?from=2024-01-01T00%3A00%3A00Z");
  });

  it("concatena múltiplos params com &", () => {
    const result = buildQuery({ page: 2, pageSize: 20, status: "Paid" });
    expect(result).toBe("?page=2&pageSize=20&status=Paid");
  });

  it("converte número para string", () => {
    expect(buildQuery({ amount: 150 })).toBe("?amount=150");
  });
});
