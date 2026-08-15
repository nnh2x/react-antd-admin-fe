import { useMemo } from "react";
import { DEFAULT_PREFERENCES, usePreferencesStore } from "#src/store/preferences";
import { isDarkTheme } from "#src/utils/is-dark-theme";

import { isLightTheme } from "#src/utils/is-light-theme";

/**
 * Wraps user preference parameters that don't need to be stored in localStorage, but can appear here for convenience.
 *
 * @returns An object containing user preferences, including theme, whether it's the default setting, whether it's a dark theme, and whether it's a light theme
 */
export function usePreferences() {
	const preferences = usePreferencesStore();
	const { theme } = preferences;

	// Whether this is the default user preference setting
	const isDefault = useMemo(() => {
		return Object.entries(DEFAULT_PREFERENCES).every(([key, value]) => {
			return preferences[key as keyof typeof preferences] === value;
		});
	}, [preferences]);

	return {
		...preferences,
		isDefault,
		isDark: isDarkTheme(theme),
		isLight: isLightTheme(theme),
	};
}
