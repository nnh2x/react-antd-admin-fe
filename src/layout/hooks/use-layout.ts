import { useMemo } from "react";
import { useDeviceType } from "#src/hooks/use-device-type";
import {
	MIXED_NAVIGATION,
	SIDE_NAVIGATION,
	TOP_NAVIGATION,
	TWO_COLUMN_NAVIGATION,
} from "#src/layout/widgets/preferences/blocks/layout/constants";

import { usePreferencesStore } from "#src/store/preferences";

/**
 * Get the layout type information of the current page
 *
 * @returns Returns an object containing the current layout type information, including:
 * - currentLayout: current navigation type
 * - isSideNav: whether it is side navigation
 * - isTopNav: whether it is top navigation
 * - isMixedNav: whether it is mixed navigation
 * - isTwoColumnNav: whether it is two-column navigation
 */
export function useLayout() {
	const { isMobile } = useDeviceType();
	// LayoutType
	const navigationStyle = usePreferencesStore(state => state.navigationStyle);
	const sidebarWidth = usePreferencesStore(state => state.sidebarWidth);
	const sideCollapsedWidth = usePreferencesStore(state => state.sideCollapsedWidth);
	const firstColumnWidthInTwoColumnNavigation = usePreferencesStore(state => state.firstColumnWidthInTwoColumnNavigation);

	/**
	 * Current navigation type
	 */
	const currentLayout = useMemo(
		() => isMobile ? SIDE_NAVIGATION : navigationStyle,
		[isMobile, navigationStyle],
	);

	/**
	 * Whether it is side navigation
	 */
	const isSideNav = useMemo(
		() => currentLayout === SIDE_NAVIGATION,
		[currentLayout],
	);

	/**
	 * Whether it is top navigation
	 */
	const isTopNav = useMemo(
		() => currentLayout === TOP_NAVIGATION,
		[currentLayout],
	);

	/**
	 * Whether it is two-column navigation
	 */
	const isTwoColumnNav = useMemo(
		() => currentLayout === TWO_COLUMN_NAVIGATION,
		[currentLayout],
	);

	/**
	 * Whether it is mixed navigation
	 */
	const isMixedNav = useMemo(
		() => currentLayout === MIXED_NAVIGATION,
		[currentLayout],
	);

	return {
		currentLayout,
		isSideNav,
		isTopNav,
		isMixedNav,
		isTwoColumnNav,
		sidebarWidth,
		sideCollapsedWidth,
		firstColumnWidthInTwoColumnNavigation,
	};
}
