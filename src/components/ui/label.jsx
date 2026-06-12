export const Label = ({ children, className = '', ...props }) => (
  <label className={`block text-sm font-medium mb-1 ${className}`} {...props}>
    {children}
  </label>
)