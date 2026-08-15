import type { ReactNode } from "react";

import { ConfigProvider, theme } from "antd";

import { useContext } from "react";
import { ThemeProvider } from "react-jss";
import { usePreferences } from "#src/hooks/use-preferences";

/**
 * Custom JSS theme provider component
 *
 * Custom JSS theme provider component, used to provide JSS themes in React applications
 */
export interface JSSThemeProviderProps {
	/**
	 * Children components
	 *
	 * Children components, which will receive the JSS theme
	 */
	children: ReactNode
}

const { useToken } = theme;

/**
 * JSSThemeProvider component
 *
 * JSSThemeProvider component, used to pass Ant Design tokens and global theme state to child components
 *
 * @param {JSSThemeProviderProps} props Component properties
 * @returns {JSX.Element} The resulting JSX element
 */
export function JSSThemeProvider({ children }: JSSThemeProviderProps) {
	const antdContext = useContext(ConfigProvider.ConfigContext);
	const prefixCls = antdContext.getPrefixCls();
	const { token } = useToken();
	const { theme, isDark, isLight } = usePreferences();

	return (
		<ThemeProvider theme={{ token, theme, isDark, isLight, prefixCls }}>
			{children}
		</ThemeProvider>
	);
}
