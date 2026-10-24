/**
 * Token-backed indicator colors for status and toast kinds.
 * Returns `var(--color-*)` references for use in `:style` bindings and icon props.
 */
export function statusColor(status: string): string {
  switch (status) {
    case 'success':
    case 'done':
      return 'var(--color-urgency-green)'
    case 'error':
      return 'var(--color-destructive)'
    case 'cancelled':
      return 'var(--color-text-muted)'
    case 'saved-after-cancel':
      return 'var(--color-warn)'
    default:
      // info / running / loading
      return 'var(--color-primary)'
  }
}
