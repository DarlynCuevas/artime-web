'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2, Clock, FileText, Loader2, Upload, X, XCircle } from 'lucide-react';
import { getVerificationStatus, uploadVerificationDocument, type VerificationStatus } from '@/services/settings/settings.service';

interface Props {
    token: string;
}

const statusConfig: Record<VerificationStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; description: string }> = {
    UNVERIFIED: {
        label: 'Sin verificar',
        icon: <FileText className="w-8 h-8" />,
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        description: 'Tu perfil aún no ha sido verificado. Sube tu documento de identidad para obtener el badge de perfil verificado.',
    },
    PENDING: {
        label: 'En revisión',
        icon: <Clock className="w-8 h-8" />,
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        description: 'Hemos recibido tu documentación y la estamos revisando. Este proceso puede tardar entre 24 y 48 horas.',
    },
    VERIFIED: {
        label: 'Perfil verificado',
        icon: <BadgeCheck className="w-8 h-8" />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        description: '¡Tu identidad ha sido verificada! Tu perfil muestra el badge de verificación oficial.',
    },
    REJECTED: {
        label: 'Documentación rechazada',
        icon: <XCircle className="w-8 h-8" />,
        color: 'text-rose-600',
        bg: 'bg-rose-100',
        border: 'border-rose-200',
        description: 'Tu documentación ha sido rechazada. Puedes enviar nuevos documentos.',
    },
};

export function VerificationSection({ token }: Props) {
    const [status, setStatus] = useState<VerificationStatus>('UNVERIFIED');
    const [submittedAt, setSubmittedAt] = useState<string | undefined>();
    const [rejectionReason, setRejectionReason] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLoading(true);
        getVerificationStatus(token)
            .then(data => {
                setStatus(data.status);
                setSubmittedAt(data.submittedAt);
                setRejectionReason(data.rejectionReason);
            })
            .catch(() => setStatus('UNVERIFIED'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
        setFiles(prev => [...prev, ...dropped].slice(0, 3));
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        setFiles(prev => [...prev, ...selected].slice(0, 3));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setMessage(null);
        try {
            await uploadVerificationDocument(files, token);
            setStatus('PENDING');
            setFiles([]);
            setMessage({ type: 'ok', text: 'Documentación enviada correctamente. La revisaremos en 24-48 horas.' });
        } catch (err: any) {
            setMessage({ type: 'err', text: err?.message ?? 'No se pudo enviar la documentación' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const config = statusConfig[status];
    const canSubmit = status === 'UNVERIFIED' || status === 'REJECTED';

    return (
        <div className="space-y-8">

            {/* Estado actual */}
            <div className={`rounded-3xl border ${config.border} p-6 flex flex-col items-center text-center space-y-3`}>
                <div className={`w-20 h-20 rounded-full ${config.bg} ${config.color} flex items-center justify-center`}>
                    {config.icon}
                </div>
                <div>
                    <p className="text-xl font-black text-slate-900">{config.label}</p>
                    {submittedAt && (
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                            Enviado el {new Date(submittedAt).toLocaleDateString('es-ES')}
                        </p>
                    )}
                </div>
                <p className="text-sm font-medium text-slate-600 max-w-md leading-relaxed">
                    {config.description}
                </p>
                {rejectionReason && (
                    <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 font-medium text-left">
                        <strong>Motivo del rechazo:</strong> {rejectionReason}
                    </div>
                )}
            </div>

            {status === 'VERIFIED' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                        <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-800">Badge activo en tu perfil</p>
                        <p className="text-xs text-emerald-700/80">Ya aparece en tus perfiles público y privado.</p>
                    </div>
                </div>
            )}

            {/* Formulario de subida (solo cuando aplica) */}
            {canSubmit && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Subir documentación</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            Acepta: DNI o pasaporte (frente y reverso). Formatos: JPG, PNG, PDF. Máximo 3 archivos.
                        </p>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDrop={handleFileDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-slate-50/30 p-10 flex flex-col items-center justify-center gap-3 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700">Arrastra tus archivos aquí</p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">o haz clic para seleccionar</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                    </div>

                    {/* Archivos seleccionados */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {message && (
                        <div className={`rounded-xl p-3 text-sm font-medium flex items-center gap-2 ${message.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {message.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Enviando…' : `Enviar documentación${files.length > 0 ? ` (${files.length} archivo${files.length > 1 ? 's' : ''})` : ''}`}
                    </button>
                </div>
            )}
        </div>
    );
}
