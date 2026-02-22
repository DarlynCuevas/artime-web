'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, Mail, Save, Trash2 } from 'lucide-react';
import { changeEmail, changePassword, deleteAccount } from '@/services/settings/settings.service';

interface Props {
    token: string;
    currentEmail?: string;
    onLogout?: () => void;
}

export function AccountSection({ token, currentEmail = '', onLogout }: Props) {
    // Email
    const [newEmail, setNewEmail] = useState('');
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailMessage, setEmailMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Password
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdMessage, setPwdMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Delete account
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setEmailSaving(true);
        setEmailMessage(null);
        try {
            await changeEmail(newEmail, token);
            setEmailMessage({ type: 'ok', text: 'Se ha enviado un email de confirmación a la nueva dirección.' });
            setNewEmail('');
        } catch (err: any) {
            setEmailMessage({ type: 'err', text: err?.message ?? 'No se pudo cambiar el email' });
        } finally {
            setEmailSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            setPwdMessage({ type: 'err', text: 'Las contraseñas no coinciden' });
            return;
        }
        if (newPwd.length < 8) {
            setPwdMessage({ type: 'err', text: 'La contraseña debe tener al menos 8 caracteres' });
            return;
        }
        setPwdSaving(true);
        setPwdMessage(null);
        try {
            await changePassword(currentPwd, newPwd, token);
            setPwdMessage({ type: 'ok', text: 'Contraseña actualizada correctamente.' });
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
        } catch (err: any) {
            setPwdMessage({ type: 'err', text: err?.message ?? 'No se pudo cambiar la contraseña' });
        } finally {
            setPwdSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'BORRAR') return;
        setDeleting(true);
        try {
            await deleteAccount(token);
            onLogout?.();
        } catch (err: any) {
            setShowDeleteModal(false);
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-10">

            {/* ─── Cambiar email ─────────────────────────────────────────────────── */}
            <section className="space-y-4">
                <SectionLabel icon={<Mail className="w-4 h-4" />} label="Email de la cuenta" />

                {currentEmail && (
                    <p className="text-sm text-slate-500">
                        Email actual: <span className="font-semibold text-slate-700">{currentEmail}</span>
                    </p>
                )}

                <form onSubmit={handleEmailChange} className="space-y-3">
                    <Field label="Nuevo email">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="nuevo@email.com"
                            required
                            className={inputClass}
                        />
                    </Field>

                    {emailMessage && <Feedback type={emailMessage.type} text={emailMessage.text} />}

                    <button type="submit" disabled={emailSaving} className={primaryBtn}>
                        {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {emailSaving ? 'Enviando…' : 'Actualizar email'}
                    </button>
                </form>
            </section>

            {/* ─── Cambiar contraseña ───────────────────────────────────────────── */}
            <section className="space-y-4">
                <SectionLabel icon={<KeyRound className="w-4 h-4" />} label="Contraseña" />

                <form onSubmit={handlePasswordChange} className="space-y-3">
                    <Field label="Contraseña actual">
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                value={currentPwd}
                                onChange={e => setCurrentPwd(e.target.value)}
                                placeholder="Tu contraseña actual"
                                required
                                className={inputClass + ' pr-10'}
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>

                    <Field label="Nueva contraseña">
                        <input
                            type={showPwd ? 'text' : 'password'}
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Confirmar nueva contraseña">
                        <input
                            type={showPwd ? 'text' : 'password'}
                            value={confirmPwd}
                            onChange={e => setConfirmPwd(e.target.value)}
                            placeholder="Repite la nueva contraseña"
                            required
                            className={inputClass}
                        />
                    </Field>

                    {pwdMessage && <Feedback type={pwdMessage.type} text={pwdMessage.text} />}

                    <button type="submit" disabled={pwdSaving} className={primaryBtn}>
                        {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {pwdSaving ? 'Guardando…' : 'Cambiar contraseña'}
                    </button>
                </form>
            </section>

            {/* ─── Zona peligrosa ───────────────────────────────────────────────── */}
            <section className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
                <SectionLabel icon={<Trash2 className="w-4 h-4 text-rose-500" />} label="Zona de peligro" />

                <p className="text-sm text-slate-600 font-medium">
                    Eliminar tu cuenta es una acción irreversible. Se borrarán todos tus datos, perfil y reservas activas.
                </p>

                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-white px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                    Eliminar mi cuenta
                </button>
            </section>

            {/* ─── Modal de eliminación ─────────────────────────────────────────── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl space-y-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                                <Trash2 className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">¿Eliminar tu cuenta?</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Esta acción no se puede deshacer. Para confirmar, escribe <strong>BORRAR</strong> a continuación.
                            </p>
                        </div>

                        <input
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="Escribe BORRAR para confirmar"
                            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-sm font-bold text-rose-600 placeholder:font-normal placeholder:text-slate-400 focus:border-rose-400 focus:outline-none transition-all"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                                className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== 'BORRAR' || deleting}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-40"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {deleting ? 'Eliminando…' : 'Eliminar cuenta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all';
const primaryBtn = 'flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:translate-y-0';

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

function Feedback({ type, text }: { type: 'ok' | 'err'; text: string }) {
    return (
        <div className={`rounded-xl p-3 text-sm font-medium ${type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
            {text}
        </div>
    );
}
