import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createBooking } from '@/services/bookings/bookings.service';
import { getArtists } from '@/services/artists/artists.service';

export function CreateBookingForm() {
  const { user } = useAuth();

  const [artists, setArtists] = useState<any[]>([]);
  const [artistId, setArtistId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [message, setMessage] = useState(
    `Estamos interesados en contratarte para una actuación.

Las condiciones iniciales están detalladas en esta propuesta.
Quedamos atentos a tu respuesta.`
  );
  const [loading, setLoading] = useState(false);

  // 1️⃣ cargar artistas
  useEffect(() => {
    if (!user?.token) return;
    getArtists(user.token).then(setArtists);
  }, [user?.token]);

  // 2️⃣ submit del formulario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      
      setLoading(true);

      // 3️⃣ llamar al backend
      const booking = await createBooking(
        {
          artistId,
          start_date: startDate,
          totalAmount: Number(totalAmount),
          currency: 'EUR',
          message,
        },
        user.token
      );

      // 4️⃣ 👉 AQUÍ VA EL REDIRECT
      window.location.href = `/bookings/${booking.id}`;

    } catch (error) {
      alert('No se pudo crear la contratación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear propuesta de contratación</h1>

      <label>Artista</label>
      <select
        value={artistId}
        onChange={(e) => setArtistId(e.target.value)}
        required
      >
        <option value="">Selecciona un artista</option>
        {artists.map((artist) => (
          <option key={artist.id} value={artist.id}>
            {artist.name}
          </option>
        ))}
      </select>

      <label>Fecha</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <label>Precio (€)</label>
      <input
        type="number"
        value={totalAmount}
        onChange={(e) => setTotalAmount(e.target.value)}
        required
      />

      <label>Mensaje inicial (opcional)</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Enviando…' : 'Enviar propuesta de contratación'}
      </button>
    </form>
  );
}
