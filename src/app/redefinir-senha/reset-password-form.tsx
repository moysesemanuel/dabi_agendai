"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./reset-password.module.css";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/customers/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível redefinir a senha.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setLoading(false);
    }
  }

  if (!token) {
    return <p className={styles.error}>Link inválido. Solicite um novo pelo login.</p>;
  }

  if (success) {
    return <p className={styles.success}>Senha redefinida com sucesso! Redirecionando...</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="newPassword">Nova senha</label>
        <input
          id="newPassword"
          type="password"
          minLength={6}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirmPassword">Confirme a nova senha</label>
        <input
          id="confirmPassword"
          type="password"
          minLength={6}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
