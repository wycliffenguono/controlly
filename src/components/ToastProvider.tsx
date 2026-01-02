// src/components/ToastProvider.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type Toast = { id: string; kind?: 'success'|'error'|'info'; title: string; message?: string };
type ToastContextType = { add: (t: Omit<Toast,'id'>) => void; remove: (id: string) => void };
const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => {
    const id = String(Date.now() + Math.random());
    setToasts(s => [...s, { id, ...t }]);
    setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), 4500);
  };
  const remove = (id: string) => setToasts(s => s.filter(t => t.id !== id));
  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="fixed right-4 bottom-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm p-3 rounded shadow ${t.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-white dark:bg-gray-800 dark:text-white'}`}>
            <div className="font-semibold">{t.title}</div>
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};