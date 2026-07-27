// Shared bits of the admin vocabulary. Only classes that are used verbatim in
// more than one place belong here — the `field` and `button` strings are
// deliberately left local to each screen, because /admin needs denser padding
// and Tailwind v4 resolves conflicts by generated-CSS order, so composing
// `${field} py-1.5` would silently lose to the original `py-3`.

/** Small square toggle. Pair with chipOn or chipOff. */
export const chip =
  "border hairline px-2 py-1 text-xs transition disabled:opacity-50";

/** Toggle in its active state: inverted, the way the design signals "on". */
export const chipOn = "bg-[var(--color-paper)] text-[var(--color-ink)]";

/** Toggle in its resting state. */
export const chipOff =
  "text-[var(--color-paper-dim)] hover:text-[var(--color-gold)]";
