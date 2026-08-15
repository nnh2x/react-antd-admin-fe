import { useResponsive } from "ahooks";

/**
 * Determine the current device type (mobile device, iPad, PC, etc.)
 *
 */
export function useDeviceType() {
	// If using useBreakpoint, note that useResponsive and antd's useBreakpoint behave differently for xs
	/**
	 * The default breakpoints for useResponsive are:
	 * @see https://ahooks.js.org/hooks/use-responsive
	 * {
	 *   xs: 0,
	 *   sm: 576,
	 *   md: 768,
	 *   lg: 992,
	 *   xl: 1200,
	 * }
	 */
	const responsive = useResponsive();
	const isMobile = (responsive.xs && !responsive.sm) || (responsive.sm && !responsive.md);
	const isIpad = responsive.md && !responsive.xl;
	const isPC = responsive.xl;

	return { isMobile, isIpad, isPC };
}
