import plugin from "tailwindcss/plugin";

import { getColorPalettes } from "#src/styles/theme/antd/css-variables";

/**
 * How to use custom plugin in tailwindcss
 * @see https://github.com/tailwindlabs/tailwindcss/discussions/13292#discussioncomment-14256365
 */
export default plugin.withOptions(() => {
	return () => { };
}, () => {
	return {
		theme: {
			/**
			 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
			 */
			colors: {
				/**
				 * Use Ant Design's color system to replace Tailwind CSS's default color configuration
				 * Note: For light and dark modes, colors other than the base palette automatically adapt to the theme with no extra configuration needed (e.g. bg-colorBorderSecondary)
				 * But the base palette (e.g. bg-cyan-100) still needs dark mode styles set manually
				 * @see https://ant.design/docs/spec/colors
				 *
				 */
				...getColorPalettes,
			},
		},
	};
});
