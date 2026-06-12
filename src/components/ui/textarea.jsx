export const Textarea = ({ className = '', ...props }) => (
  <textarea className={`w-full border rounded p-2 ${className}`} rows="3" {...props} />
)