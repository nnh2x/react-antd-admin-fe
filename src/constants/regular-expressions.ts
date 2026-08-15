/**
 * Regex collection
 * @see https://any-rule.vercel.app/
 *
 * Most of the rules you need can be generated on the site above, then copied and pasted into your code.
 */

/* ================ Divider ================== */

// Username validation, 4 to 16 characters (letters, numbers, underscore, hyphen)
export const USERNAME_REGEXP = /^[\w-]{4,16}$/;

// Only contains uppercase letters, lowercase letters, and numbers
export const ALPHA_NUMERIC_ONLY_REGEXP = /^[A-Z0-9]+$/i;

/**
 * @description Unified Social Credit Code
 * @see https://creditbj.jxj.beijing.gov.cn/credit-portal/credit_service/legal/search
 *
 * @example 91110105MA0071F38D, 91110105MADDCJMC8C, 91110101MABUT67T06
 */
export const UNIFIED_SOCIAL_CREDIT_CODE_REGEXP = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;

/**
 * @description Mobile phone number, just needs to start with 1
 *
 * @example 008618311006933, +8617888829981, 19119255642
 */
export const MOBILE_PHONE_REGEXP = /^(?:(?:\+|00)86)?1\d{10}$/;

export const TELEPHONE_REGEXP = /^(?:(?:\d{3}-)?\d{8}|(?:\d{4}-)?\d{7,8})(?:-\d+)?$/;
