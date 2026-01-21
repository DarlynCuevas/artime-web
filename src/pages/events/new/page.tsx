import { useState } from 'react';
import { useRouter } from 'next/router';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      setSubmitting(true);

      await eventsService.createEvent(
        { name, start_date: startDate },
        user.token
      );

      router.push('/events');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* INTRO CONCEPTUAL */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>
          Crear evento
        </h1>

        <p style={{ color: '#444', maxWidth: 620, fontSize: 16 }}>
          En ARTIME, un evento no es una actuación ni una contratación.
          Es una estructura desde la que organizar y gestionar trabajo profesional.
        </p>
      </header>

      {/* QUÉ ES / QUÉ NO ES */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            border: '1px solid #ddd',
            padding: 16,
            background: '#fafafa',
          }}
        >
          <strong>Qué es un evento</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18, color: '#555' }}>
            <li>Un marco de planificación</li>
            <li>Un contenedor de contrataciones</li>
            <li>Un punto de control operativo</li>
          </ul>
        </div>

        <div
          style={{
            border: '1px solid #ddd',
            padding: 16,
          }}
        >
          <strong>Qué no es</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18, color: '#555' }}>
            <li>Una actuación confirmada</li>
            <li>Una publicación pública</li>
            <li>Un compromiso irreversible</li>
          </ul>
        </div>
      </section>

      {/* DEFINICIÓN MÍNIMA */}
      <form onSubmit={handleSubmit}>
        <section
          style={{
            border: '1px solid #ddd',
            padding: 20,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>
            Definición básica
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Nombre del evento
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Ciclo de conciertos primavera"
              style={{ width: '100%' }}
            />

            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
              Este nombre será visible para las contrataciones asociadas.
            </p>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Fecha de inicio
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ width: '100%' }}
            />

            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
              La fecha puede modificarse más adelante.
            </p>
          </div>
        </section>

        {/* ACCIÓN CONSCIENTE */}
        <section>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting
              ? 'Creando estructura…'
              : 'Crear evento'}
          </button>

          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
            Podrás editar el evento y añadir contrataciones después.
          </p>
        </section>
      </form>
    </main>
  );
}
