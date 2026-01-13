// Detalle de evento
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Event } from '../../types/event';
import { eventsService } from '../../services/events.service';
import { useEventInterestedArtists } from '@/app/hooks/useEventInterestedArtists';


export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);


    useEffect(() => {
        eventsService.getEvent(id as string).then(setEvent);
    }, [id]);

    if (!event) return <p>Cargando…</p>;
    const { artists, loading } = useEventInterestedArtists(event.id);
    return (
        <div>
            <h1>{event.name}</h1>
            <p>Estado: {event.status}</p>

            <p>
                Este evento agrupa varias actuaciones.
                Las contrataciones se gestionan individualmente.
            </p>

            {event.status !== 'CANCELLED' && (
                <>
                    <button
                        onClick={async () => {
                            await eventsService.cancelEvent(event.id);
                            router.refresh();
                        }}
                    >
                        Cancelar evento
                    </button>
                    {event.status === 'DRAFT' && (
                        <button
                            onClick={async () => {
                                await eventsService.startSearch(event.id);
                                router.refresh();
                            }}
                        >
                            Empezar búsqueda de artistas
                        </button>
                    )}
                </>
            )}
            <section>
                <h2>Artistas interesados</h2>

                {loading && <p>Cargando interesados…</p>}

                {!loading && artists.length === 0 && (
                    <p>Ningún artista ha mostrado interés todavía.</p>
                )}

                <ul>
                    {artists.map((a) => (
                        <li key={a.invitationId}>
                            Artista ID: {a.artistId}
                        </li>
                    ))}
                </ul>

                <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
                    Mostrar interés no implica contratación.
                </p>
            </section>

        </div>

    );
}
