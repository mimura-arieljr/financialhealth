import { useCallback, useState } from 'react'
import { useModalClose } from '../../hooks/useModalClose'
import { Modal } from './modal'
import { Button } from './button'
import { ConfirmContext } from './confirmContext'

function ConfirmBody({ request }) {
  const close = useModalClose()
  return (
    <>
      {request.body && <p className="text-sm text-muted leading-relaxed">{request.body}</p>}
      <div className="flex justify-end gap-2 pt-6">
        <Button variant="light" onClick={close}>Cancel</Button>
        <Button variant={request.tone === 'ink' ? 'ink' : 'danger'} autoFocus onClick={() => { request.resolve(true); close() }}>
          {request.confirmLabel || 'Confirm'}
        </Button>
      </div>
    </>
  )
}

// One confirmation modal for the app, opened with useConfirm()
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const confirm = useCallback((options) => new Promise(resolve => setRequest({ ...options, resolve })), [])
  // Any close that was not a confirm (Cancel, X, Escape, backdrop) answers no
  const dismiss = () => {
    request?.resolve(false)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} onClose={dismiss}>
          <ConfirmBody request={request} />
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}
