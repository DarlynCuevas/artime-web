// Crear evento (Pages Router)
import { useState } from 'react';
import { useRouter } from 'next/router';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/useAuth';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [start_date, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      setSubmitting(true);

      await eventsService.createEvent(
        { name, start_date },
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
        maxWidth: 680,
        margin: '0 auto',
        padding: '56px 24px',
      }}
    >
      {/* TÍTULO + INTENCIÓN */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Definir un evento
        </h1>

        <p style={{ color: '#444', fontSize: 16, maxWidth: 560 }}>
          Un evento en ARTIME es una estructura de trabajo desde la que
          organizar contrataciones y tomar decisiones con trazabilidad.
        </p>
      </header>

      {/* MARCO MENTAL */}
      <section
        style={{
          marginBottom: 40,
          paddingLeft: 16,
          borderLeft: '3px solid #000',
        }}
      >
        <p style={{ color: '#555' }}>
          No estás confirmando actuaciones ni enviando propuestas.
          Estás creando un marco que podrás completar, ajustar y usar
          como referencia operativa.
        </p>
      </section>

      {/* DEFINICIÓN MÍNIMA */}
      <form onSubmit={handleSubmit}>
        <section
          style={{
            border: '1px solid #ddd',
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 20 }}>
            Definición mínima del evento
          </h2>

          <div style={{ marginBottom: 24 }}>
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
              style={{ width: '100%' }}
              placeholder="Ej. Ciclo acústico otoño"
            />

            <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
              Utiliza un nombre que te ayude a identificar el contexto
              del trabajo, no una actuación concreta.
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
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ width: '100%' }}
            />

            <p style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
              Esta fecha sirve como referencia inicial y puede modificarse.
            </p>
          </div>
        </section>

        {/* ACCIÓN */}
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
              ? 'Creando evento…'
              : 'Crear evento'}
          </button>

          <p style={{ color: '#666', fontSize: 14, marginTop: 10 }}>
            Podrás añadir contrataciones y gestionar el evento a continuación.
          </p>
        </section>
      </form>
    </main>
  );
}
