"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; action?: { label: string; onClick: () => void } };
const Ctx = createContext<(message: string, action?: Toast["action"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, action?: Toast["action"]) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, action }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="glass glass-lite rounded-2xl px-4 py-3 text-sm">
            <p>{toast.message}</p>
            {toast.action && (
              <button className="mt-2 font-semibold underline" onClick={toast.action.onClick}>
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
