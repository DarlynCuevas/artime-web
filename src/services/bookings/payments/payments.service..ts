const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * PASO 16 (TEST)
 * 1. Crea schedule + milestone
 * 2. Obtiene milestones
 * 3. Crea PaymentIntent para el milestone ADVANCE
 */
export async function preparePaymentForBooking(
  bookingId: string,
  token: string
): Promise<{ clientSecret: string; milestoneId: string }> {

  // 1️ Crear schedule + milestone
  await fetch(
    `${API_URL}/payments/bookings/${bookingId}/schedule`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );

  // 2️ Obtener milestones
  const milestonesRes = await fetch(
    `${API_URL}/payments/bookings/${bookingId}/milestones`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
    }
  );

  if (!milestonesRes.ok) {
    throw new Error("Error obteniendo milestones");
  }

  const milestones = await milestonesRes.json();

  const advanceMilestone = milestones.find(
    (m: any) => m.type === "ADVANCE"
  );

  if (!advanceMilestone) {
    throw new Error("No existe milestone ADVANCE");
  }

  // 3️ Crear PaymentIntent
  const intentRes = await fetch(
    `${API_URL}/payments/create-payment-intent/${advanceMilestone.id}`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
    }
  );

  if (!intentRes.ok) {
    throw new Error("Error creando PaymentIntent");
  }

  const intentData = await intentRes.json();

  return {
    clientSecret: intentData.clientSecret,
    milestoneId: advanceMilestone.id,
  };
}


export async function getMilestonesForBooking(
  bookingId: string,
  token: string
) {
  const res = await fetch(
    `${API_URL}/payments/bookings/${bookingId}/milestones`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Error obteniendo milestones");
  }

  return res.json();
}

export async function createPaymentIntentForMilestone(
  milestoneId: string,
  token: string
) {
  const res = await fetch(
    `${API_URL}/payments/create-payment-intent/${milestoneId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Error creando PaymentIntent");
  }

  return res.json(); // { clientSecret }
}


