import { describe, expect, it } from "vitest";
import { applyCurrencyMask, formatCentsToBRL } from "./currency-mask";

// Intl.NumberFormat pt-BR/BRL usa NBSP ( ) entre "R$" e o valor, nao espaco comum.
const NBSP = " ";

describe("formatCentsToBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(formatCentsToBRL(0)).toBe(`R$${NBSP}0,00`);
    expect(formatCentsToBRL(2500)).toBe(`R$${NBSP}25,00`);
    expect(formatCentsToBRL(100000)).toBe(`R$${NBSP}1.000,00`);
  });
});

describe("applyCurrencyMask", () => {
  it("trata os digitos digitados como centavos, da direita pra esquerda", () => {
    expect(applyCurrencyMask("2500")).toBe(`R$${NBSP}25,00`);
    expect(applyCurrencyMask("7590")).toBe(`R$${NBSP}75,90`);
  });

  it("ignora qualquer caractere que nao seja digito", () => {
    expect(applyCurrencyMask(`R$${NBSP}25,00`)).toBe(`R$${NBSP}25,00`);
  });

  it("volta pra R$ 0,00 quando nao sobra nenhum digito", () => {
    expect(applyCurrencyMask("")).toBe(`R$${NBSP}0,00`);
    expect(applyCurrencyMask("R$ ,")).toBe(`R$${NBSP}0,00`);
  });
});
