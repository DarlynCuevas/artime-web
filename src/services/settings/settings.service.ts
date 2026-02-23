const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FiscalData {
    fiscalName: string;
    taxId: string; // CIF / NIF
    fiscalAddress: string;
    fiscalCountry: string;
    iban?: string; // Para artistas y venues
}

export interface NotificationPreferences {
    bookings: boolean;
    payments: boolean;
    messages: boolean;
    system: boolean;
    marketing: boolean;
    suggestions: boolean;
}

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface VerificationInfo {
    status: VerificationStatus;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

// ─── Fiscal Data ──────────────────────────────────────────────────────────────

/** TODO: backend endpoint GET /users/fiscal */
export async function getFiscalData(token: string): Promise<FiscalData> {
    const res = await fetch(`${API}/users/fiscal`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudieron cargar los datos fiscales');
    return res.json();
}

/** TODO: backend endpoint PATCH /users/fiscal */
export async function updateFiscalData(data: Partial<FiscalData>, token: string): Promise<void> {
    const res = await fetch(`${API}/users/fiscal`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('No se pudieron guardar los datos fiscales');
}

// ─── Account ──────────────────────────────────────────────────────────────────

/** TODO: backend endpoint POST /users/change-email */
export async function changeEmail(newEmail: string, token: string): Promise<void> {
    const res = await fetch(`${API}/users/change-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el email');
}

/** TODO: backend endpoint POST /users/change-password */
export async function changePassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
    const res = await fetch(`${API}/users/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) throw new Error('No se pudo cambiar la contraseña');
}

/** TODO: backend endpoint DELETE /users/account */
export async function deleteAccount(token: string): Promise<void> {
    const res = await fetch(`${API}/users/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo eliminar la cuenta');
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** TODO: backend endpoint GET /users/notification-preferences */
export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
    const res = await fetch(`${API}/users/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudieron cargar las preferencias');
    return res.json();
}

/** TODO: backend endpoint PATCH /users/notification-preferences */
export async function updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>,
    token: string,
): Promise<void> {
    const res = await fetch(`${API}/users/notification-preferences`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error('No se pudieron guardar las preferencias');
}

// ─── Security ─────────────────────────────────────────────────────────────────

/** TODO: backend endpoint POST /users/sessions/close-others */
export async function closeSessions(token: string): Promise<void> {
    const res = await fetch(`${API}/users/sessions/close-others`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudieron cerrar las sesiones');
}

// ─── Verification ─────────────────────────────────────────────────────────────

/** TODO: backend endpoint GET /users/verification */
export async function getVerificationStatus(token: string): Promise<VerificationInfo> {
    const res = await fetch(`${API}/users/verification`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { status: 'UNVERIFIED' };
    return res.json();
}

/** TODO: backend endpoint POST /users/verification/upload (multipart/form-data) */
export async function uploadVerificationDocument(files: File[], token: string): Promise<void> {
    const formData = new FormData();
    files.forEach((file, i) => formData.append(`document_${i}`, file));

    const res = await fetch(`${API}/users/verification/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error('No se pudo enviar la documentación');
}
