const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type AdminVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AdminVerificationItem = {
  userId: string;
  status: AdminVerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  documentPaths?: string[];
  documents?: Array<{
    path: string;
    url: string | null;
  }>;
  user?: {
    email?: string | null;
    displayName?: string | null;
  };
};

export async function getAdminVerifications(
  token: string,
  status: AdminVerificationStatus | 'ALL' = 'PENDING',
): Promise<AdminVerificationItem[]> {
  const res = await fetch(`${API}/admin/verifications?status=${status}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('No se pudieron cargar verificaciones');
  }
  return res.json();
}

export async function reviewAdminVerification(
  token: string,
  userId: string,
  payload: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string | null },
): Promise<void> {
  const res = await fetch(`${API}/admin/verifications/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('No se pudo actualizar la verificacion');
  }
}
