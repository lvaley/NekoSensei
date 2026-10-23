import { Button, Modal } from 'react-bootstrap'
import { TravelPreviewPanel } from '../ui/TravelPreviewPanel'

interface TravelModalProps {
  enrollmentId: string
  viewerRole: 'student' | 'tutor'
  title: string
  onClose: () => void
}

// Ruta y traslado de una inscripción a domicilio (el tutor la revisa antes de aceptar)
export function TravelModal({ enrollmentId, viewerRole, title, onClose }: TravelModalProps) {
  return (
    <Modal show onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">
          {viewerRole === 'tutor' ? 'Ruta hacia el estudiante' : 'Traslado del tutor'} · {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <TravelPreviewPanel url={`/enrollments/${enrollmentId}/travel`} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
