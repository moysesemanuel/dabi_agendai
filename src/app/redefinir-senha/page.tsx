import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";
import styles from "./reset-password.module.css";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Redefinir senha</h1>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
