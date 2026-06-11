// AccessibleButton — a thin wrapper over the standard
// `<button>` element that ensures every interactive element in
// the park has the right accessibility defaults without
// requiring every callsite to re-write the same long class
// string.
//
// What this adds for callers:
//   * `type="button"` by default so the button never accidentally
//     submits a `<form>`.
//   * `aria-label` fall-through: if the caller doesn't pass
//     `aria-label` and the child is a plain string, the string
//     becomes the `aria-label` (otherwise screen readers would
//     still announce the visible text, so this is mostly a
//     convenience).
//   * The standard `focus-visible:outline-2` ring in the
//     `fantasy-cream` accent (`#FFF4B8`).
//   * Disabled handling that flips the cursor to `not-allowed`.
//
// Existing call sites that already pass `aria-label`, custom
// classNames, or other props continue to work — `...rest` is
// spread first, the wrapper's defaults only fill in anything
// the caller didn't provide.
import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type AccessibleButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> & {
  /**
   * Optional explicit label. If omitted and the child is a plain
   * string, the string is reused as the aria-label. Falls back
   * to the child if the caller needs full control.
   */
  label?: string;
  /** Optional test id override (defaults to `data-testid`). */
  testId?: string;
};

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  function AccessibleButton(
    { label, testId, className = '', children, disabled, ...rest },
    ref,
  ) {
    const computedLabel =
      label ??
      (typeof children === 'string' || typeof children === 'number'
        ? String(children)
        : undefined);
    return (
      <button
        ref={ref}
        // `type="button"` is the right default for non-submit buttons.
        // The DOM's default is "submit" when the button lives inside
        // a `<form>`, which has bitten us in the past.
        type="button"
        aria-label={computedLabel}
        data-testid={testId}
        disabled={disabled}
        className={[
          // Standard focus-visible ring in the fantasy-cream accent.
          // Tailwind's `outline` utilities produce a 2px outline at
          // 2px offset, matching the AC-14 spec.
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fantasy-cream',
          // Disabled cursor override so disabled buttons read as
          // non-interactive to mouse users.
          disabled ? 'cursor-not-allowed opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

export default AccessibleButton;
