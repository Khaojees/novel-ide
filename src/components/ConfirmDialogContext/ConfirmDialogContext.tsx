// src/components/ConfirmDialogContext/ConfirmDialogContext.tsx - Fixed CSS
import React, { createContext, useContext, useState, ReactNode } from "react";
import ReactDOM from "react-dom";

type ConfirmDialogOptions = {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmDialogContextType = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(
  null
);

export const useConfirm = () => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx)
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return ctx.confirm;
};

export const ConfirmDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [dialogState, setDialogState] = useState<{
    options: ConfirmDialogOptions;
    resolve: (result: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({ options, resolve });
    });
  };

  const handleClose = (result: boolean) => {
    if (dialogState) {
      dialogState.resolve(result);
      setDialogState(null);
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialogState &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <h2
                style={{
                  color: "var(--text-primary)",
                  fontSize: "18px",
                  fontWeight: "600",
                  margin: "0 0 12px 0",
                }}
              >
                {dialogState.options.title || "Confirm"}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  margin: "0 0 20px 0",
                }}
              >
                {dialogState.options.message}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "80px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-tertiary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {dialogState.options.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "80px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#b91c1c";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                >
                  {dialogState.options.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmDialogContext.Provider>
  );
};
