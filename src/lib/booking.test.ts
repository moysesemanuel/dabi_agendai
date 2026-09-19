import { describe, expect, it } from "vitest";
import {
  combineDateAndTime,
  getDateKey,
  getMinutesFromTime,
  getTimeFromMinutes,
  overlaps,
} from "./booking";

describe("getMinutesFromTime / getTimeFromMinutes", () => {
  it("converte HH:mm para minutos desde a meia-noite", () => {
    expect(getMinutesFromTime("00:00")).toBe(0);
    expect(getMinutesFromTime("09:30")).toBe(570);
    expect(getMinutesFromTime("23:59")).toBe(1439);
  });

  it("faz o caminho inverso, com zero a esquerda", () => {
    expect(getTimeFromMinutes(0)).toBe("00:00");
    expect(getTimeFromMinutes(570)).toBe("09:30");
    expect(getTimeFromMinutes(1439)).toBe("23:59");
  });
});

describe("combineDateAndTime", () => {
  it("monta a data sempre no fuso America/Sao_Paulo (UTC-3)", () => {
    const date = combineDateAndTime("2026-06-15", "10:00");
    expect(date.toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });
});

describe("getDateKey", () => {
  it("formata no fuso de Sao Paulo independente do fuso do processo", () => {
    // 2026-01-01T02:30:00Z ainda e 2025-12-31 em America/Sao_Paulo (UTC-3)
    const date = new Date("2026-01-01T02:30:00.000Z");
    expect(getDateKey(date)).toBe("2025-12-31");
  });
});

describe("overlaps", () => {
  const base = "2026-06-15";
  const at = (time: string) => combineDateAndTime(base, time);

  it("detecta sobreposicao quando os intervalos se cruzam", () => {
    // servico existente: 10:00-10:30, nova tentativa: 10:15-10:45
    expect(overlaps(at("10:15"), at("10:45"), at("10:00"), at("10:30"))).toBe(true);
  });

  it("nao considera sobreposicao quando um horario termina exatamente onde o outro comeca", () => {
    // servico existente: 10:00-10:30, nova tentativa: 10:30-11:00 (encaixe justo)
    expect(overlaps(at("10:30"), at("11:00"), at("10:00"), at("10:30"))).toBe(false);
  });

  it("nao considera sobreposicao quando os horarios estao em janelas distintas", () => {
    expect(overlaps(at("14:00"), at("14:30"), at("10:00"), at("10:30"))).toBe(false);
  });

  it("detecta sobreposicao quando um intervalo contem o outro por completo", () => {
    // novo agendamento de 1h engloba um servico curto de 15min no meio
    expect(overlaps(at("10:00"), at("11:00"), at("10:20"), at("10:35"))).toBe(true);
  });
});
