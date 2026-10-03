/*
 * Password rules for new accounts: a length range plus one letter and one
 * number. No other composition rules and no forced rotation (NIST SP 800-63B
 * advises against them); the long maximum lets password managers and
 * passphrases through. The UI lists the rules before the customer types.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RULES = ["length", "letter", "digit"] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

const LETTER = /\p{L}/u;
const DIGIT = /\p{Nd}/u;

/** The rules a password breaks, in `PASSWORD_RULES` order (empty = valid). */
export function failedPasswordRules(password: string): PasswordRule[] {
  // Characters (code points), not UTF-16 units.
  const length = [...password].length;
  const checks: Record<PasswordRule, boolean> = {
    length: length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH,
    letter: LETTER.test(password),
    digit: DIGIT.test(password),
  };
  return PASSWORD_RULES.filter((rule) => !checks[rule]);
}
