'use client';

import { useEffect, useState } from 'react';
import { Building2, ChevronRight, Euro, Globe, Loader2, Save } from 'lucide-react';
import type { UserRole } from '@/types/user-role';
import { getFiscalData, updateFiscalData } from '@/services/settings/settings.service';

interface Props {
    token: string;
    role: UserRole;
    initialData?: {
        fiscalName?: string;
        taxId?: string;
        fiscalAddress?: string;
        fiscalCountry?: string;
        iban?: string;
    };
}

export function FiscalSection({ token, role, initialData = {} }: Props) {
    const [fiscalName, setFiscalName] = useState(initialData.fiscalName ?? '');
    const [taxId, setTaxId] = useState(initialData.taxId ?? '');
    const [fiscalAddress, setFiscalAddress] = useState(initialData.fiscalAddress ?? '');
    const [fiscalCountry, setFiscalCountry] = useState(initialData.fiscalCountry ?? 'España');
    const [iban, setIban] = useState(initialData.iban ?? '');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const showBankFields = role === 'ARTIST' || role === 'VENUE';

    useEffect(() => {
        setLoading(true);
        setError(null);
        getFiscalData(token)
            .then((data) => {
                setFiscalName(data.fiscalName ?? '');
                setTaxId(data.taxId ?? '');
                setFiscalAddress(data.fiscalAddress ?? '');
                setFiscalCountry(data.fiscalCountry ?? 'España');
                setIban(data.iban ?? '');
            })
            .catch(() => {
                // keep default/initial values
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await updateFiscalData({ fiscalName, taxId, fiscalAddress, fiscalCountry, iban }, token);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err?.message ?? 'No se pudieron guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info card */}
            <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-4 flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Euro className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-bold text-amber-900">Datos para facturación</p>
                    <p className="text-xs text-amber-700 mt-0.5 font-medium">
                        Esta información aparecerá en las facturas generadas por Artime y es necesaria para recibir pagos.
                    </p>
                </div>
            </div>

            {/* Identificación fiscal */}
            <div className="space-y-4">
                <SectionLabel icon={<Building2 className="w-4 h-4" />} label="Identificación Fiscal" />

                <Field label={role === 'VENUE' ? 'Razón social' : 'Nombre o razón social'}>
                    <input
                        value={fiscalName}
                        onChange={e => setFiscalName(e.target.value)}
                        placeholder={role === 'ARTIST' ? 'Tu nombre completo o nombre artístico' : 'Nombre de la empresa o sala'}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    />
                </Field>

                <Field label="CIF / NIF">
                    <input
                        value={taxId}
                        onChange={e => setTaxId(e.target.value)}
                        placeholder="Ej. B12345678 o 12345678A"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    />
                </Field>
            </div>

            {/* Dirección fiscal */}
            <div className="space-y-4">
                <SectionLabel icon={<Globe className="w-4 h-4" />} label="Dirección Fiscal" />

                <Field label="Dirección completa">
                    <textarea
                        value={fiscalAddress}
                        onChange={e => setFiscalAddress(e.target.value)}
                        rows={2}
                        placeholder="Calle, número, piso, código postal, ciudad"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                    />
                </Field>

                <Field label="País de residencia fiscal">
                    <select
                        value={fiscalCountry}
                        onChange={e => setFiscalCountry(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    >
                        <option value="España">España</option>
                        <option value="México">México</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Chile">Chile</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Francia">Francia</option>
                        <option value="Alemania">Alemania</option>
                        <option value="Italia">Italia</option>
                        <option value="Otro">Otro</option>
                    </select>
                </Field>
            </div>

            {/* Información bancaria (solo artistas y venues) */}
            {showBankFields && (
                <div className="space-y-4">
                    <SectionLabel icon={<Euro className="w-4 h-4" />} label="Información Bancaria" />

                    <Field label="IBAN (para recibir pagos)">
                        <input
                            value={iban}
                            onChange={e => setIban(e.target.value)}
                            placeholder="ES00 0000 0000 0000 0000 0000"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                        />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Introduce el IBAN completo con espacios o sin ellos. Tus datos bancarios están cifrados y protegidos.
                        </p>
                    </Field>
                </div>
            )}

            {/* Feedback */}
            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 font-medium">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Datos fiscales guardados correctamente.
                </div>
            )}

            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando…' : 'Guardar datos fiscales'}
            </button>
        </form>
    );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-slate-400">{icon}</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">{label}</label>
            {children}
        </div>
    );
}
