import { cn } from "@/lib/utils";

type BookingStatusVariant = "pending" | "confirmed" | "negotiating" | "cancelled" | "completed" | "rejected";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<BookingStatusVariant, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "status-pending",
  },
  confirmed: {
    label: "Confirmado",
    className: "status-confirmed",
  },
  negotiating: {
    label: "Negociando",
    className: "status-negotiating",
  },
  cancelled: {
    label: "Cancelado",
    className: "status-cancelled",
  },
  rejected: {
    label: "Rechazado",
    className: "status-cancelled",
  },
  completed: {
    label: "Completado",
    className: "status-completed",
  },
};

function normalizeStatus(status: string | undefined | null): BookingStatusVariant {
  const value = status?.toLowerCase();
  switch (value) {
    case "contract_signed":
    case "paid":
    case "paid_50":
    case "paid_75":
    case "paid_100":
    case "paid_balance":
    case "accepted":
    case "confirmed":
      return "confirmed";
    case "negotiating":
      return "negotiating";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "declined":
    case "rejected":
      return "rejected";
    case "completed":
    case "done":
      return "completed";
    case "pending":
    case "requested":
    case "awaiting":
    default:
      return "pending";
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = normalizeStatus(status);
  const config = statusConfig[variant];

  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.label}
    </span>
  );
}
