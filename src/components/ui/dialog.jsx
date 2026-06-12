export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export const DialogContent = ({ children }) => <div>{children}</div>
export const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>
export const DialogTitle = ({ children }) => <h2 className="text-xl font-bold">{children}</h2>