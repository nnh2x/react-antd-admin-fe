/**
 * This function has no practical meaning; it is only used to obtain better language prompt support for the lokalise.i18n-ally plugin.
 *
 * @link https://github.com/i18next/react-i18next/issues/1058
 * The official recommendation does not cover how to use react-i18next in pure JS or TS file scenarios, and there is currently no good solution.
 *
 */
export function $t(path: string) {
	return path;
}
