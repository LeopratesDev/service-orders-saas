"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const KIND_STYLE: Record<ToastKind, { border: string; icon: string }> = {
  success: { border: "var(--s-paid)",      icon: "✓" },
  error:   { border: "#DC2626",            icon: "✕" },
  info:    { border: "var(--s-pending)",   icon: "i" },
};

function ToastItem({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const { border, icon } = KIND_STYLE[item.kind];
  const [out, setOut] = useState(false);

  const dismiss = useCallback(() => {
    setOut(true);
    setTimeout(() => onDone(item.id), 280);
  }, [item.id, onDone]);

  // auto-dismiss
  useRef(setTimeout(dismiss, item.kind === "error" ? 5000 : 3500));

  return (
    <div
      onClick={dismiss}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        borderLeft: `3px solid ${border}`,
        borderRadius: 6,
        padding: "11px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,.10)",
        cursor: "pointer",
        maxWidth: 340,
        width: "100%",
        animation: out ? "toast-out 280ms ease forwards" : "toast-in 220ms ease",
        userSelect: "none",
      }}
    >
      <span style={{
        width: 18, height: 18,
        borderRadius: "50%",
        background: border,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink)" }}>
        {item.message}
      </span>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}>
        <style>{`
          @keyframes toast-in  { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:none } }
          @keyframes toast-out { from { opacity:1; transform:none } to { opacity:0; transform:translateX(16px) } }
        `}</style>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem item={t} onDone={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
