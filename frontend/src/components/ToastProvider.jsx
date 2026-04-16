import { useEffect, useState } from "react";
import { subscribeToToasts } from "../lib/toast";
import "./Toast.css";

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((current) => [...current, toast]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4000);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {children}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default ToastProvider;
