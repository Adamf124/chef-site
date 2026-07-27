// One definition of "an email address we're willing to put inside a URL",
// shared by the code that accepts a submission and the code that renders a
// reply link.
//
// The original check was /^[^@\s]+@[^@\s]+\.[^@\s]+$/, which excluded only "@"
// and whitespace. That accepted "a?subject=Pwned&bcc=someone@evil.com", and
// dropping it raw into a mailto: href let whoever submitted the form inject
// cc/bcc/subject/body into the reply. "%" is excluded as well, since it starts
// a percent-escape in a URI.
//
// Deliberately narrower than RFC 5322: quoted local parts and unicode
// addresses are rejected. For a contact form that is the right trade.
export const EMAIL_PATTERN = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isEmailSafe(value: string): boolean {
  // 254 is the practical ceiling on a deliverable address.
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/**
 * A mailto: href, or null when the address can't be trusted in a URL.
 * Null means "render the address as text instead" — never fall back to
 * interpolating it into a link anyway.
 */
export function mailtoHref(email: string, subject: string): string | null {
  if (!isEmailSafe(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
