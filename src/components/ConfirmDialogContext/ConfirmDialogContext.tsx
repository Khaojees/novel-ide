// ConfirmDialogContext.tsx
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
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">
                {dialogState.options.title || "Confirm"}
              </h2>
              <p className="mb-6">{dialogState.options.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  {dialogState.options.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
