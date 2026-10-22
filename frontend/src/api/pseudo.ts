// Nickname format (spec 2.5). The server checks it too, plus banned words
// and uniqueness; the front only uses it to enable the start button.
const PSEUDO_PATTERN = /^[A-Za-z0-9_-]{3,16}$/

export const PSEUDO_MAX_LENGTH = 16

export function isValidPseudo(pseudo: string): boolean {
  return PSEUDO_PATTERN.test(pseudo)
}
