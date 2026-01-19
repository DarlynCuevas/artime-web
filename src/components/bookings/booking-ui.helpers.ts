import { BookingStatus, ContractStatus, Role } from "../../types/booking";
export function getStatusMessage({
    bookingStatus,
    contractStatus,
    role,
    hasTurn,
}: {
    bookingStatus: BookingStatus;
    contractStatus?: ContractStatus;
    role: Role;
    hasTurn: boolean;
}): string | null {
    //CANCELADO
    if (bookingStatus === 'CANCELLED') {
        return 'La contratación ha sido cancelada.';
    }

    // RECHAZADO
    if (bookingStatus === 'REJECTED') {
        return 'La propuesta fue rechazada.';
    }

    // PRE-FIRMA
    if (bookingStatus === 'ACCEPTED') {
        if (role === 'VENUE' || role === 'PROMOTER') {
            return 'Contrato enviado, pendiente de firma del artista';
        }
        return 'Revisa el contrato y acéptalo para firmarlo';
    }

    // CONTRATO FIRMADO / PAGOS
    if (contractStatus === 'SIGNED') {
        if (bookingStatus === 'PAID_PARTIAL') {
            return 'Contrato en curso. Pago parcial realizado.';
        }
        if (bookingStatus === 'PAID_FULL') {
            return 'Contrato en curso. Pago completo realizado.';
        }
        return 'Contrato firmado correctamente.';
    }

    // OFERTA FINAL
    if (bookingStatus === 'FINAL_OFFER_SENT') {
        if (role === 'ARTIST' || role === 'MANAGER') {
            return 'Oferta final recibida.';
        }
        return 'Oferta final enviada. Esperando firma del artista.';
    }

    // PENDING (booking inicial)
    if (bookingStatus === 'PENDING') {
        if (role === 'VENUE' || role === 'PROMOTER') {
            return 'Esperando respuesta del artista.';
        }
        return 'Es tu turno para responder o cancelar la propuesta.';
    }

    // NEGOCIACIÓN (único sitio donde usamos hasTurn)
    if (hasTurn) {
        return 'Es tu turno para responder o cancelar la propuesta.';
    }

    return 'Esperando respuesta de la otra parte.';
}


export type PrimaryAction =
    | { type: 'SIGN_CONTRACT' }
    | { type: 'PROCEED_PAYMENT' }
    | { type: 'CANCEL_BOOKING' }
    | { type: 'ANNUL_CONTRACT' }
    | { type: 'REJECT_PROPOSAL' }
    | null;

export function getPrimaryAction({
    bookingStatus,
    contractStatus,
    role,
    hasTurn,
}: {
    bookingStatus: BookingStatus;
    contractStatus?: ContractStatus;
    role: Role;
    hasTurn: boolean;
}): PrimaryAction {

    //CANCELADO
    if (bookingStatus === 'CANCELLED') {
        return null;
    }

    // RECHAZADO
    if (bookingStatus === 'REJECTED') {
        return null;
    }

    // CONTRATO FIRMADO / PAGOS
    if (contractStatus === 'SIGNED') {
        if (bookingStatus === 'PAID_PARTIAL' || bookingStatus === 'PAID_FULL') {
            return null;
        }
        if (role === 'VENUE' || role === 'PROMOTER') {
            return { type: 'PROCEED_PAYMENT' };
        }
        return { type: 'ANNUL_CONTRACT' };
    }

    // PRE-FIRMA
    if (bookingStatus === 'ACCEPTED') {
        if (role === 'ARTIST' || role === 'MANAGER') {
            return { type: 'SIGN_CONTRACT' };
        }
        return null;
    }

    // OFERTA FINAL
    // OFERTA FINAL → acciones viven SOLO en NegotiationPanel
    if (bookingStatus === 'FINAL_OFFER_SENT') {
        return null;
    }

    // PENDING — artista/manager no pueden cancelar
    if (
        bookingStatus === 'PENDING' &&
        (role === 'ARTIST' || role === 'MANAGER')
    ) {
        return null;
    }

    // NEGOCIACIÓN
    if (hasTurn) {
        return { type: 'CANCEL_BOOKING' };
    }

    return { type: 'REJECT_PROPOSAL' };
}



export type SecondaryAction =
    | { type: 'REJECT_PROPOSAL' }
    | { type: 'CANCEL_BOOKING' }
    | { type: 'ANNUL_CONTRACT' }
    | null;

export function getSecondaryActions({

    bookingStatus,
    contractStatus,
    role,
    hasTurn,
}: {
    bookingStatus: BookingStatus;
    contractStatus?: ContractStatus;
    role: Role;
    hasTurn: boolean;
}): SecondaryAction[] {
    // Define isNegotiation aquí:
    const isNegotiation =
        bookingStatus !== 'PENDING' &&
        bookingStatus !== 'FINAL_OFFER_SENT' &&
        bookingStatus !== 'ACCEPTED' &&
        bookingStatus !== 'CANCELLED' &&
        bookingStatus !== 'REJECTED';

    //CANCELADO
    if (bookingStatus === 'CANCELLED') {
        return [];
    }

    // RECHAZADO
    if (bookingStatus === 'REJECTED') {
        return [];
    }

    // CONTRATO FIRMADO / PAGOS
    if (contractStatus === 'SIGNED') {
        return [{ type: 'ANNUL_CONTRACT' }];
    }

    // PRE-FIRMA
    if (bookingStatus === 'ACCEPTED') {
        return [{ type: 'CANCEL_BOOKING' }];
    }

    // OFERTA FINAL
    if (bookingStatus === 'FINAL_OFFER_SENT') {
        return [];
    }



    if (isNegotiation && hasTurn) {
        return [{ type: 'CANCEL_BOOKING' }];
    }

    // PENDING — artista/manager sin acciones secundarias
    if (
        bookingStatus === 'PENDING' &&
        (role === 'ARTIST' || role === 'MANAGER' || role === 'PROMOTER' || role === 'VENUE')
    ) {
        return [];
    }


    return [

    ];
}

