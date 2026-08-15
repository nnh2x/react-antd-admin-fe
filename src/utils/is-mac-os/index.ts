/**
 * Check whether the current runtime environment is macOS.
 *
 * Determined by checking the navigator.userAgent string.
 */
export function isMacOs() {
	const macRegex = /macintosh|mac os x/i;
	return macRegex.test(navigator.userAgent);
}
