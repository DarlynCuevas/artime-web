import { cn } from "@/lib/utils";

type BookingStatusVariant =
  | "pending"
  | "confirmed"
  | "paid"
  | "negotiating"
  | "final_offer"
  | "cancelled"
  | "completed"
  | "rejected";

interface StatusBadgeProps {
  status: string;
  paidPercent?: number | null;
  className?: string;
  currentRole?: string;
  finalOfferSenderRole?: string | null;
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
  paid: {
    label: "Pagado",
    className: "status-confirmed",
  },
  negotiating: {
    label: "Negociando",
    className: "status-negotiating",
  },
  final_offer: {
    label: "Oferta final enviada",
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
    case "final_offer_sent":
      return "final_offer";
    case "final_offer_accepted":
      return "confirmed";
    case "final_offer_rejected":
      return "rejected";
    case "contract_signed":
      return "confirmed";
    case "paid_partial":
    case "paid_full":
    case "paid":
    case "paid_50":
    case "paid_75":
    case "paid_100":
    case "paid_balance":
      return "paid";
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

export function StatusBadge({
  status,
  paidPercent,
  className,
  currentRole,
  finalOfferSenderRole,
}: StatusBadgeProps) {
  const variant = normalizeStatus(status);
  const config = statusConfig[variant];
  const showPaidPercent =
    variant === "paid" &&
    typeof paidPercent === "number" &&
    paidPercent > 0 &&
    paidPercent < 100;
  const isFinalOffer = variant === "final_offer";
  const finalOfferLabel =
    isFinalOffer && currentRole && finalOfferSenderRole
      ? currentRole === finalOfferSenderRole
        ? "Oferta final enviada"
        : "Oferta final recibida"
      : isFinalOffer
        ? "Oferta final enviada"
        : null;

  return (
    <span className={cn("status-badge", config.className, className)}>
      {showPaidPercent
        ? `Pagado ${paidPercent}%`
        : isFinalOffer
          ? finalOfferLabel
          : config.label}
    </span>
  );
}
