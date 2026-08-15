/**
 * Determine whether the current theme is a dark theme
 *
 * @param theme Theme name, one of 'dark', 'light', or 'auto'
 * @returns Returns true if the current theme is dark; otherwise returns false
 */
export function isDarkTheme(theme: string) {
	let dark = theme === "dark";
	if (theme === "auto") {
		dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	}
	return dark;
}
