import { useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import { ProfileForm } from '../components/profile/ProfileForm'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Profile() {
  useDocumentTitle('Mi perfil')
  const [saved, setSaved] = useState(false)

  return (
    <Container className="page-container">
      <Row className="justify-content-center">
        <Col lg={9} xl={8}>
          <p className="eyebrow mb-2">Cuenta</p>
          <h1 className="h2 mb-4">Mi perfil</h1>
          {saved && (
            <Alert variant="success" role="status">
              Tus cambios se guardaron correctamente.
            </Alert>
          )}
          <ProfileForm
            mode="edit"
            onSaved={() => {
              setSaved(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </Col>
      </Row>
    </Container>
  )
}
