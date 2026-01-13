import { PayoutStatus } from '../../types/payout-status.enum';

export function PayoutStatusBadge({
  status,
}: {
  status: PayoutStatus;
}) {
  const labelMap: Record<PayoutStatus, string> = {
    [PayoutStatus.PENDING]: 'Pendiente',
    [PayoutStatus.READY_TO_PAY]: 'Listo para pago',
    [PayoutStatus.PAID]: 'Pagado',
    [PayoutStatus.FAILED]: 'Pago fallido',
  };

  return (
    <span style={{ fontWeight: 'bold' }}>
      Estado: {labelMap[status]}
    </span>
  );
}
