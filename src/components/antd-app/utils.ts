import type { GlobalToken } from "antd";
import { baseColorPalettes, neutralColors, prefix, productLevelColorSystem } from "./constants";

/**
 * Convert a hex color value to an RGB color value, because hex color values don't support opacity in tailwind, e.g. you can't use bg-blue-500/20
 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function hexToRGB(hex: string) {
	// Remove the leading # if present
	hex = hex.replace("#", "");

	// Get the R, G, B values
	const r = Number.parseInt(hex.substring(0, 2), 16);
	const g = Number.parseInt(hex.substring(2, 4), 16);
	const b = Number.parseInt(hex.substring(4, 6), 16);

	return `${r} ${g} ${b}`;
}

// Determine whether it's an RGB color value
export function isRGBColor(color: string) {
	return color.trim().startsWith("rgb");
}

export function getCSSVariablesByTokens(tokens: GlobalToken) {
	return Object.entries(tokens)
		.reduce((acc, [key, value]): string => {
			// Functional color system, excluding the neutral color system
			if (productLevelColorSystem.includes(key)) {
				const rgb = hexToRGB(value);
				return `${acc}--${prefix}-${key}:${rgb};`;
			}

			// Neutral color system
			if (neutralColors.includes(key)) {
				// If the color value is already in rgb format, use it directly
				const rgb = isRGBColor(value) ? value : `rgb(${hexToRGB(value)})`;
				return `${acc}--${prefix}-${key}:${rgb};`;
			}
			// Color palette
			return baseColorPalettes.includes(key) ? `${acc}--${prefix}-${key}:${hexToRGB(value)};` : acc;
		}, "");
}
