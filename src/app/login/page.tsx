"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ important
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // ✅ ROLE BASED REDIRECT
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginOverlay}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.brand}>NARA PULSE</h1>
          <div className={styles.subtitle}>Staff Allocation System</div>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <User size={18} />
              <input
                className={styles.input}
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input
                className={styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Secure Login</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <div className={styles.footer}>
          <div>&copy; 2026 Nara Desert Escapes</div>
          <div className={styles.version}>v2.0.27</div>
        </div>
      </div>
    </div>
  );
}
