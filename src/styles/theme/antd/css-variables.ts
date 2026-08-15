import { colorPaletteNumbers, colors, neutralColorPalettes, neutralColors, productLevelColorSystem } from "#src/components/antd-app/constants";
import { hexToRGB } from "#src/components/antd-app/utils";

/**
 * Override the color variables in tailwind.css with antd's color variables.
 */
function createColorPalettes() {
	const colorPaletteVar: Record<string, string> = {
		transparent: "transparent",
		inherit: "inherit",
		current: "currentColor",
		white: "rgb(255 255 255)",
		black: "rgb(0 0 0)",
	};

	/**
	 * Base color palette
	 * @see https://ant.design/docs/spec/colors#base-color-palettes
	 */
	colors.forEach((color) => {
		colorPaletteNumbers.forEach((number, index) => {
			const colorCount = index === 0 ? "" : `-${index}`;
			colorPaletteVar[`${color}-${number}`] = `rgb(var(--oo-${color}${colorCount}))`;
		});
	});

	/**
	 * Neutral color palette
	 * @see https://ant.design/docs/spec/colors#neutral-color-palette
	 */
	colorPaletteNumbers.forEach((number, index) => {
		const rgb = hexToRGB(neutralColorPalettes[index]);
		colorPaletteVar[`gray-${number}`] = `rgb(${rgb})`;
	});

	/**
	 * Product level color system
	 */
	productLevelColorSystem.forEach((key) => {
		const keyName = key.replace("color", "");
		const camelCaseName = keyName.charAt(0).toLowerCase() + keyName.slice(1);
		colorPaletteVar[camelCaseName] = `rgb(var(--oo-${key}))`;
	});

	/**
	 * Neutrals
	 */
	neutralColors.forEach((key) => {
		// Make this key directly a color value wrapped in the rgb function
		colorPaletteVar[key] = `var(--oo-${key})`;
	});

	return colorPaletteVar;
}

export const getColorPalettes = createColorPalettes();
