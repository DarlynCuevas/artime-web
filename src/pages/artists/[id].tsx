import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type ArtistProfile = {
    id: string;
    name: string;
    city: string;
    genres: string[];
    bio?: string;
    basePrice: number;
    currency: string;
    isNegotiable: boolean;
    rating?: number;
};

export default function ArtistProfilePage() {
    const router = useRouter();
    const { id, date } = router.query as { id: string; date?: string };
    const { user } = useAuth();

    const [artist, setArtist] = useState<ArtistProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !user?.token) return;

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${id}`, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
        })
            .then((r) => r.json())
            .then(setArtist)
            .finally(() => setLoading(false));
    }, [id, user?.token]);

    if (loading) return <p style={{ padding: 24 }}>Cargando artista…</p>;
    if (!artist) return <p style={{ padding: 24 }}>Artista no encontrado</p>;

    return (
        <main
            style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '32px 24px',
            }}
        >
            {/* HEADER — IDENTIDAD */}
            <header style={{ marginBottom: 32 }}>
                <h1 style={{ marginBottom: 8 }}>{artist.name}</h1>
                <p style={{ color: '#555' }}>
                    {artist.city}
                    {Array.isArray(artist.genres) && artist.genres.length > 0
                        ? ` · ${artist.genres.join(', ')}`
                        : ''}
                </p>
            </header>

            {/* 1️⃣ CONDICIONES ECONÓMICAS BASE */}
            <section
                style={{
                    border: '1px solid #ddd',
                    padding: 16,
                    marginBottom: 24,
                }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 8 }}>
                    Condiciones económicas base
                </h2>

                <p>
                    <strong>
                        {artist.basePrice} {artist.currency}
                    </strong>
                </p>

                <p style={{ color: '#555', fontSize: 13 }}>
                    {artist.isNegotiable
                        ? 'Condición negociable'
                        : 'Condición no negociable'}
                </p>
            </section>

            {/* 2️⃣ PERFIL PROFESIONAL */}
            <section
                style={{
                    border: '1px solid #ddd',
                    padding: 16,
                    marginBottom: 24,
                }}
            >
                <h2 style={{ fontSize: 16, marginBottom: 8 }}>
                    Perfil profesional
                </h2>

                {artist.bio ? (
                    <p>{artist.bio}</p>
                ) : (
                    <p style={{ color: '#666' }}>
                        No hay descripción profesional registrada.
                    </p>
                )}
            </section>

            {/* 3️⃣ INFORMACIÓN SECUNDARIA */}
            {typeof artist.rating === 'number' && (
                <section style={{ marginBottom: 24 }}>
                    <p style={{ color: '#666', fontSize: 13 }}>
                        Valoración registrada: {artist.rating}
                    </p>
                </section>
            )}

            {/* 4️⃣ ACCIÓN OPERATIVA (NEUTRA) */}
            <section>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
                    Este perfil puede utilizarse como base para iniciar
                    una propuesta de contratación.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        router.push(
                            date
                                ? `/bookings/new?artistId=${artist.id}&date=${date}`
                                : `/bookings/new?artistId=${artist.id}`
                        );
                    }}
                >
                    Iniciar propuesta de contratación
                </button>
            </section>
        </main>
    );
}
