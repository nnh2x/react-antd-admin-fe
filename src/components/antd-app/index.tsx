import type { ReactNode } from "react";

import { theme as antdTheme, App } from "antd";

import { useEffect } from "react";
import { StaticAntd } from "#src/utils/static-antd";

import { setupAntdThemeTokensToHtml } from "./setup-antd-theme";

export interface AntdAppProps {
	children: ReactNode
}

export function AntdApp({ children }: AntdAppProps) {
	const { token: antdTokens } = antdTheme.useToken();

	useEffect(() => {
		/* Log to check the supported tokens */
		// console.log("antdTokens", antdTokens);
		setupAntdThemeTokensToHtml(antdTokens);
	}, [antdTokens]);

	return (
		<App className="h-full">
			<StaticAntd />
			{children}
		</App>
	);
}
