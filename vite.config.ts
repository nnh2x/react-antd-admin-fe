/// <reference types="vitest/config" />

import process from "node:process";
import { cleanupSVG, isEmptyColor, parseColors, runSVGO, SVG } from "@iconify/tools";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import dayjs from "dayjs";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { checker } from "vite-plugin-checker";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import svgrPlugin from "vite-plugin-svgr";

import { author, dependencies, devDependencies, license, name, version } from "./package.json";

const __APP_INFO__ = {
	pkg: { dependencies, devDependencies, name, version, license, author },
	lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
};

const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config/
export default defineConfig({

	base: isDev ? "/" : "/react-antd-admin/",
	plugins: [
		vitePluginFakeServer({
			basename: "/api",
			enableProd: true,
			timeout: 1000,
		}),
		// https://github.com/pd4d10/vite-plugin-svgr#options
		svgrPlugin({
			// https://react-svgr.com/docs/options/
			svgrOptions: {
				plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
				svgoConfig: {
					floatPrecision: 2,
				},
			},
		}),
		checker({
			typescript: true,
			terminal: false,
			enableBuild: false,
		}),
		/**
		 * Click a DOM element on the page to open your IDE with the cursor
		 * automatically positioned at the corresponding source code location.
		 *
		 * Default shortcut on macOS: Option + Shift
		 * Default shortcut on Windows: Alt + Shift
		 * While holding the shortcut on the page, moving the mouse highlights the
		 * hovered DOM element with an overlay showing its info; clicking it opens
		 * the IDE at that element's source location.
		 * More usage: https://inspector.fe-dev.cn/guide/start.html
		 */
		codeInspectorPlugin({
			bundler: "vite",
			// hideConsole: true,
		}),

		/**
		 * On-demand icon loading
		 * https://github.com/antfu/unplugin-icons
		 */
		Icons({
			customCollections: {
				svg: FileSystemIconLoader("./src/icons/svg"),
			},
			/**
			 * @see https://iconify.design/docs/articles/cleaning-up-icons/#parsing-one-monotone-icon
			 * Cleaning up icons
			 * Set default color to currentColor
			 * Set default width and height to 1em
			 */
			transform: (svg, collection) => {
				if (collection === "svg") {
					const svgObject = new SVG(svg);
					cleanupSVG(svgObject);
					runSVGO(svgObject);
					parseColors(svgObject, {
						defaultColor: "currentColor",
						callback: (attr, colorStr, color) => {
							if (!color) {
								// Color cannot be parsed!
								throw new Error(`Invalid color: "${colorStr}" in attribute ${attr}`);
							}

							if (isEmptyColor(color)) {
								// Color is empty: 'none' or 'transparent'. Return as is
								return color;
							}

							// If color is not empty, return it
							return color;
						},
					});
					return svgObject.toString({ height: "1em", width: "1em" }); ;
				}
				return svg;
			},
			compiler: "jsx",
			jsx: "react",
			scale: 1,
		}),

		tailwindcss(),
		react(),
	],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/setupTests.ts"],
	},
	server: {
		port: 3333,
		// https://vitejs.dev/config/server-options#server-proxy
		proxy: {
			// "/api": {
			// 	target: "http://191.255.255.123:8888",
			// 	changeOrigin: true,
			// 	rewrite: path => isDev ? path.replace(/^\/api/, "") : path,
			// },
		},
	},
	define: {
		__APP_INFO__: JSON.stringify(__APP_INFO__),
	},
	build: {
		// Generate license file after build
		license: true,
		outDir: "build",
		sourcemap: false,
		// Adjust chunk size warning limit (default 500 kB).
		chunkSizeWarningLimit: 2000,
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{
							name: "react",
							// ["react", "react-dom", "react-router"]
							test: /node_modules[\\/]react/,
						},
						{
							name: "antd",
							// ["antd", "@ant-design/icons"]
							test: /node_modules[\\/](antd|@ant-design[\\/]icons)/,
						},
						{
							name: "faker",
							// ["@faker-js/faker"]
							test: /node_modules[\\/]@faker-js[\\/]faker/,
						},
					],
				},
			},
		},
	},
});
