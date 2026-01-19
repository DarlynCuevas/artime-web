import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useState } from "react"
import type { StripeCardElement } from "@stripe/stripe-js"

export function PaymentForm({
    clientSecret,
    onSuccess,
}: {
    clientSecret: string
    onSuccess: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!stripe || !elements || loading) return

        const cardElement = elements.getElement(CardElement) as StripeCardElement | null

        if (!cardElement) {
            setError("El formulario de tarjeta no está listo")
            return
        }

        setLoading(true)
        setError(null)

        const result = await stripe.confirmCardPayment(
            clientSecret,
            {
                payment_method: {
                    card: cardElement,
                },
            }
        )

        if (result.error) {
            setError(result.error.message ?? "Pago fallido")
            setLoading(false)
            return
        }

        if (result.paymentIntent?.status === "succeeded") {
            onSuccess()
        }

        setLoading(false)
    }

    return (
        <div>
            <CardElement />
            {error && <p>{error}</p>}
            <button onClick={handleSubmit} disabled={loading || !stripe}>
                {loading ? "Procesando…" : "Pagar"}
            </button>
        </div>
    )
}
