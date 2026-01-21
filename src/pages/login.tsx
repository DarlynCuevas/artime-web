import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/services/supabase/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 40 }}>
      <h1>Iniciar sesión</h1>

      <div style={{ marginTop: 24 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
        />

        {error && (
          <p style={{ color: 'red', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </main>
  );
}
