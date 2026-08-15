/**
 * Determine whether the current theme is a light theme
 *
 * @param theme Theme name, can be "light", "dark", or "auto"
 * @returns Returns true if the current theme is light; otherwise returns false
 */
export function isLightTheme(theme: string) {
	let light = theme === "light";
	if (theme === "auto") {
		light = window.matchMedia("(prefers-color-scheme: light)").matches;
	}
	return light;
}
