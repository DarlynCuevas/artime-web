
import { usePayouts } from '@/hooks/payouts/usePayouts';
import { PayoutItem } from './PayoutItem';

export default function PayoutsPage() {
  const { payouts, loading, error } = usePayouts();

  if (loading) return <p>Cargando payouts…</p>;
  if (error) return <p>Error: {error}</p>;

  if (payouts.length === 0) {
    return <p>No tienes payouts todavía.</p>;
  }

  return (
    <div>
      <h1>Mis pagos</h1>
      {payouts.map(payout => (
        <PayoutItem key={payout.id} payout={payout} />
      ))}
    </div>
  );
}
