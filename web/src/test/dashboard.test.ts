import { describe, it, expect } from "vitest";

// fmtShort — lógica de formatação abreviada de valores
function fmtShort(n: number) {
  if (n === 0) return "R$ 0";
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}

describe("fmtShort", () => {
  it("retorna 'R$ 0' para zero", () => {
    expect(fmtShort(0)).toBe("R$ 0");
  });

  it("formata valores abaixo de 1000 com toLocaleString", () => {
    expect(fmtShort(500)).toBe("R$ 500");
  });

  it("abrevia milhares com sufixo k", () => {
    expect(fmtShort(1000)).toBe("R$ 1,0k");
  });

  it("abrevia 5500 como 5,5k", () => {
    expect(fmtShort(5500)).toBe("R$ 5,5k");
  });

  it("arredonda para uma casa decimal", () => {
    expect(fmtShort(1234)).toBe("R$ 1,2k");
  });
});

// STATUS_LABEL — mapeamento de status para rótulos em português
const STATUS_LABEL: Record<string, string> = {
  Draft:     "Rascunho",
  Pending:   "Aguardando Pix",
  Paid:      "Pago",
  Cancelled: "Cancelado",
};

describe("STATUS_LABEL", () => {
  it("mapeia Draft para Rascunho", () => {
    expect(STATUS_LABEL["Draft"]).toBe("Rascunho");
  });

  it("mapeia Pending para Aguardando Pix", () => {
    expect(STATUS_LABEL["Pending"]).toBe("Aguardando Pix");
  });

  it("mapeia Paid para Pago", () => {
    expect(STATUS_LABEL["Paid"]).toBe("Pago");
  });

  it("mapeia Cancelled para Cancelado", () => {
    expect(STATUS_LABEL["Cancelled"]).toBe("Cancelado");
  });

  it("cobre todos os 4 status", () => {
    const keys = Object.keys(STATUS_LABEL);
    expect(keys).toHaveLength(4);
    expect(keys).toContain("Draft");
    expect(keys).toContain("Pending");
    expect(keys).toContain("Paid");
    expect(keys).toContain("Cancelled");
  });
});
