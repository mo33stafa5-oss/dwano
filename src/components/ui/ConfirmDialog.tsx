"use client";

import Modal from "./Modal";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد", danger, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-light !py-2.5">
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn("btn !py-2.5 text-white", danger ? "bg-rose-600 hover:bg-rose-700" : "bg-brand hover:bg-[#00a483]")}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm font-medium leading-loose text-muted">{message}</p>
    </Modal>
  );
}
