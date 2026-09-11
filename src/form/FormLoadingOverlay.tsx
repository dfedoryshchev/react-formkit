import React, { useEffect, useRef } from 'react'

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.6)',
}

// Blocking overlay for the submitting state. It is mounted only for the length
// of the submit, so mount and unmount are the whole lifecycle of the focus trap.
const FormLoadingOverlay: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const node = ref.current
        if (!node) return

        const restoreTo = document.activeElement as HTMLElement | null
        node.focus()

        const holdFocus = () => {
            if (!node.contains(document.activeElement)) node.focus()
        }

        const trapTab = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return
            event.preventDefault()
            node.focus()
        }

        document.addEventListener('focusin', holdFocus, true)
        document.addEventListener('keydown', trapTab, true)

        return () => {
            // Detach the guards before restoring focus: holdFocus would read the
            // restore as focus escaping and pull it back onto an overlay that is
            // already on its way out, leaving focus on the body.
            document.removeEventListener('focusin', holdFocus, true)
            document.removeEventListener('keydown', trapTab, true)
            if (restoreTo && restoreTo.isConnected) restoreTo.focus()
        }
    }, [])

    return (
        <div
            ref={ref}
            className="fk-form-loading-overlay"
            role="status"
            aria-live="polite"
            tabIndex={-1}
            style={overlayStyle}
        >
            Submitting...
        </div>
    )
}

export default FormLoadingOverlay
