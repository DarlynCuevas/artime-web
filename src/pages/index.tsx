import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { ArrowRight, BadgeCheck, Banknote, FileSignature, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';

export default function IndexPage() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: meLoading } = useMe();
  const router = useRouter();


  useEffect(() => {
    if (authLoading || meLoading) {
      return;
    }

    // Si hay usuario y role definido
    if (role === 'VENUE') {
      router.replace('/venues');
      return;
    }
    if (role === 'ARTIST') {
      router.replace('/artists/dashboard');
      return;
    }
    if (role === 'PROMOTER') {
      router.replace('/promoter/dashboard');
      return;
    }
    if (role === 'MANAGER') {
      router.replace('/manager/dashboard');
      return;
    }

    // Si user existe pero role es null, NO redirigir (esperar a que role se actualice)
  }, [user, role, authLoading, meLoading, router]);

  if (authLoading || meLoading) {
    return (
      <main className="min-h-[100svh] bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Cargando…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-[100svh] bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="min-h-[100svh] bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black tracking-tight text-slate-900">
              Art<span className="text-brand-amber">·</span>ime
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Plataforma pro
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-brand-amber px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.18)] hover:bg-amber-400 transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-brand-amber blur-[140px] opacity-15" />
          <div className="absolute -bottom-48 -left-48 h-[520px] w-[520px] rounded-full bg-blue-500 blur-[160px] opacity-10" />

          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                  Contratación artística, sin opacidad
                </p>
                <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                  Contratos, estados y pagos.
                  <span className="block text-slate-500">Todo dentro de ARTIME.</span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Formaliza cada booking con trazabilidad total: negociación registrada, contrato claro y pagos centralizados.
                  Una única fuente de verdad para artistas, salas, managers y promotores.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    Empezar <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors sm:hidden"
                  >
                    Iniciar sesión
                  </Link>
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cómo funciona
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniPill icon={<Waypoints className="h-4 w-4" />} title="Trazabilidad" desc="Historial auditable" />
                  <MiniPill icon={<FileSignature className="h-4 w-4" />} title="Contrato" desc="Firma dentro del sistema" />
                  <MiniPill icon={<Banknote className="h-4 w-4" />} title="Pagos" desc="Centralizados y claros" />
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-white/50 bg-white/60 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none" />

                  <div className="relative h-[420px]">
                    <img
                      src="/hero-backstage.jpg"
                      alt="Backstage de un evento"
                      className="h-full w-full object-cover"
                      style={{ filter: 'saturate(0.9) contrast(1.02) brightness(0.92)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

                    {/* Overlay card */}
                    <div className="absolute left-4 right-4 bottom-4 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                        Ejemplo de booking
                      </p>
                      <p className="mt-1 text-base font-black leading-tight">Oferta final enviada · pendiente de aceptación</p>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        <Step label="Propuesta" active />
                        <Step label="Negociación" active />
                        <Step label="Oferta final" active />
                        <Step label="Contrato" />
                        <Step label="Pago" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -z-10 -bottom-10 -right-10 h-40 w-40 rounded-full bg-brand-amber blur-[80px] opacity-20" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Flujo</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">De propuesta a pago, sin saltos fuera del sistema</h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <HowStep n="01" title="Booking" desc="Se inicia la contratación." />
            <HowStep n="02" title="Negociación" desc="Contraofertas registradas." />
            <HowStep n="03" title="Oferta final" desc="Explícita y única." />
            <HowStep n="04" title="Contrato" desc="Firma dentro de ARTIME." />
            <HowStep n="05" title="Pago" desc="Centralizado y auditado." />
          </div>
        </section>

        {/* For who */}
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-12">
          <div className="rounded-[32px] border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Roles</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight">Hecho para profesionales del directo</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <RoleCard title="Artistas" desc="Control total y visibilidad." items={['Acepta o negocia propuestas', 'Firma contratos', 'Recibe pagos centralizados']} />
              <RoleCard title="Salas" desc="Contrata con rigor y claridad." items={['Crea bookings', 'Dashboard financiero', 'Sin pagos fuera de ARTIME']} />
              <RoleCard title="Managers" desc="Representación visible y formal." items={['Negocia por el artista', 'Firma contratos', 'Comisión fija (v1)']} />
              <RoleCard title="Promotores" desc="Eventos, line-up y presupuesto." items={['Bookings dentro de evento', 'Invitaciones y control', 'Trazabilidad de acuerdos']} />
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Principle
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Transparencia por diseño"
              desc="Todas las partes ven la misma información. Nada implícito, nada ambiguo."
            />
            <Principle
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Estados explícitos"
              desc="Un booking siempre tiene estado claro. El backend es la autoridad."
            />
            <Principle
              icon={<Waypoints className="h-5 w-5" />}
              title="Trazabilidad auditable"
              desc="Cada acción queda registrada. El sistema reduce conflicto y fricción."
            />
            <Principle
              icon={<Sparkles className="h-5 w-5" />}
              title="Profesional, sin rigidez"
              desc="Serio y premium, pero pensado para el ritmo real de la industria."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ARTIME. Contratación artística profesional.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <Link className="hover:text-amber-700 transition-colors" href="/login">Acceso</Link>
            <Link className="hover:text-amber-700 transition-colors" href="/register">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MiniPill({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-700">
        <span className="text-amber-600">{icon}</span>
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function Step({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-1.5 w-full rounded-full ${active ? 'bg-brand-amber' : 'bg-white/20'}`} />
      <span className="text-[10px] font-bold text-white/70 truncate">{label}</span>
    </div>
  );
}

function HowStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black">
          {n}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, desc, items }: { title: string; desc: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
      <ul className="mt-4 space-y-2 text-xs text-slate-600">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-amber shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Principle({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
