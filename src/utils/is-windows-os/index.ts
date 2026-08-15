/**
 * Check whether the current runtime environment is Windows OS.
 *
 * Determined by checking the navigator.userAgent string.
 */
export function isWindowsOs() {
	const windowsRegex = /windows|win32/i;
	return windowsRegex.test(navigator.userAgent);
}
