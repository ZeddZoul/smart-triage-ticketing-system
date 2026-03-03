"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#fafafa",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 32,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            backgroundColor: "#fff",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: "0 0 8px", color: "#dc2626" }}>
            Something went wrong
          </h2>
          <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 14 }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#18181b",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
