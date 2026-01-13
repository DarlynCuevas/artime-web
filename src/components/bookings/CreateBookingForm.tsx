import { useState } from 'react';

import { useCreateBooking } from '@/hooks/useCreateBooking';
import { useAuth } from '@/hooks/useAuth';


interface Props  {
  eventId: string;
  artistId: string;
  onSuccess: () => void;
}

export function CreateBookingForm({ eventId, artistId, onSuccess }: Props ) {
  const { user } = useAuth(); // 👈 importante
  const { submit, loading, error } = useCreateBooking(user.token);

  const [totalAmount, setTotalAmount] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submit({
      artistId,
      eventId,
      currency: 'EUR',
      totalAmount,
      // start_date: ... // Aquí puedes pasar start_date si lo tienes disponible en el formulario
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Caché (€)
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(Number(e.target.value))}
          required
        />
      </label>

      {error && <p>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creando…' : 'Crear booking'}
      </button>
    </form>
  );
}


