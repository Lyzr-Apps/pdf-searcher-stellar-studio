import { useEffect, useState } from 'react'
import {
  installAgentInterceptor,
  onInterceptorError,
  clearPendingError,
  sendFixRequestToParent,
} from '@/lib/agent-fetch-interceptor'
import { isInIframe } from '@/components/ErrorBoundary'

interface PendingError {
  error: {
    type: string
    message: string
    raw_response?: string
  }
  fullResponse: any
}

/**
 * Error Modal Component - Shows when API/parse errors are detected
 */
function ErrorModal({
  error,
  onDismiss,
  onFix,
}: {
  error: PendingError
  onDismiss: () => void
  onFix: () => void
}) {
  const inIframe = isInIframe()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚠️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              Response Error Detected
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
              {error.error.type === 'parse_error' ? 'JSON parsing issue' : error.error.type}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#991B1B', fontFamily: 'monospace' }}>
            {error.error.message}
          </p>
        </div>

        {/* Raw Response Preview */}
        {error.error.raw_response && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
              Raw response (data exists):
            </p>
            <div
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '120px',
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {error.error.raw_response.substring(0, 500)}
                {error.error.raw_response.length > 500 ? '...' : ''}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          {inIframe && (
            <button
              onClick={onFix}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔧 Fix with AI
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Provider that installs the global fetch interceptor for Lyzr Agent API calls.
 * Shows error modal when issues are detected, lets user click "Fix with AI".
 *
 * Add this to your layout.tsx to enable error detection for ALL agent calls.
 */
export function AgentInterceptorProvider({ children }: { children: React.ReactNode }) {
  const [pendingError, setPendingError] = useState<PendingError | null>(null)

  useEffect(() => {
    // Install interceptor on mount
    installAgentInterceptor()

    // Register callback to receive error notifications
    onInterceptorError((error) => {
      setPendingError(error)
    })
  }, [])

  const handleDismiss = () => {
    clearPendingError()
    setPendingError(null)
  }

  const handleFix = () => {
    sendFixRequestToParent()
    setPendingError(null)
  }

  return (
    <>
      {children}
      {pendingError && (
        <ErrorModal error={pendingError} onDismiss={handleDismiss} onFix={handleFix} />
      )}
    </>
  )
}

export default AgentInterceptorProvider
