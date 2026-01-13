// web/src/components/bookings/CreateBookingModal.tsx
import { CreateBookingForm } from './CreateBookingForm';

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  artistId: string;
}

export function CreateBookingModal({ open, onClose, eventId, artistId }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Iniciar contratación</h2>
        <CreateBookingForm
          eventId={eventId}
          artistId={artistId}
          onSuccess={onClose}
        />
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
