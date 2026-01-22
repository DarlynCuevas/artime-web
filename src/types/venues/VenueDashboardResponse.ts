import { BookingStatus } from "../booking"

type VenueDashboardResponse = {
  activeBookings: {
    id: string
    artistName: string
    status: BookingStatus
    startDate: string
    totalAmount: number
  }[]

  alerts: {
    type: 'NEGOTIATION_EXPIRING' | 'NEW_MESSAGE'
    bookingId: string
    message: string
    expiresAt?: string
  }[]

  pendingActions: {
    type: 'PAYMENT' | 'NEGOTIATION_REPLY' | 'CONTRACT_SIGNATURE'
    bookingId: string
    title: string
    subtitle?: string
    dueDate?: string
    amount?: number
  }[]

  monthlySummary: {
    confirmedCount: number
    negotiatingCount: number
    committedVolume: number
  }
}
