import type { MenuProps } from "antd";
import type { MenuItemType } from "./types";

import { Menu } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useMatches } from "react-router";

import { useDeviceType } from "#src/hooks/use-device-type";
import { usePreferences } from "#src/hooks/use-preferences";

import { removeTrailingSlash } from "#src/router/utils/remove-trailing-slash";
import { useAccessStore } from "#src/store/access";
import { cn } from "#src/utils/cn";

import { useStyles } from "./style";
import { getParentKeys } from "./utils";

interface LayoutMenuProps {
	mode?: MenuProps["mode"]
	/**
	 * Controls whether to automatically expand the menu item corresponding to the current route
	 *
	 * Why?
	 * Note: when the menu mode is top navigation mode, and the menu mode is horizontal, the menu should not auto-expand on first entering the page. autoExpandCurrentMenu can be set to false to disable the auto-expand feature
	 * @see https://github.com/user-attachments/assets/705ae01d-db7f-4f42-b4dd-66adba0dd68f
	 */
	autoExpandCurrentMenu?: boolean
	menus?: MenuItemType[]
	handleMenuSelect?: (key: string, mode: MenuProps["mode"]) => void
}

const emptyArray: MenuItemType[] = [];
export default function LayoutMenu({
	mode = "inline",
	autoExpandCurrentMenu,
	handleMenuSelect,
	menus = emptyArray,
}: LayoutMenuProps) {
	const classes = useStyles();
	const matches = useMatches();
	const wholeMenus = useAccessStore(state => state.wholeMenus);
	const { sidebarCollapsed, sidebarTheme, isDark, accordion } = usePreferences();
	const [openKeys, setOpenKeys] = useState<string[]>([]);
	const { isMobile } = useDeviceType();

	const menuParentKeys = useMemo(() => {
		return getParentKeys(wholeMenus);
	}, [wholeMenus]);

	const getSelectedKeys = useMemo(
		() => {
			// First, try to find a route that specifies currentActiveMenu (highest priority)
			const currentActiveMatch = matches.findLast(routeItem =>
				routeItem.handle?.currentActiveMenu,
			);

			// If found, return the currentActiveMenu path with its parent keys
			if (currentActiveMatch?.handle?.currentActiveMenu) {
				const activeMenuPath = removeTrailingSlash(currentActiveMatch.handle.currentActiveMenu);
				const parentKeys = menuParentKeys[activeMenuPath] || [];
				return [...parentKeys, activeMenuPath];
			}

			// Fallback: Find the last visible route (not hidden in menu)
			const latestVisibleMatch = matches.findLast(routeItem =>
				routeItem.handle?.hideInMenu !== true,
			);

			// If found, return the route ID path with its parent keys
			if (latestVisibleMatch?.id) {
				const routePath = removeTrailingSlash(latestVisibleMatch.id);
				const parentKeys = menuParentKeys[routePath] || [];
				return [...parentKeys, routePath];
			}

			// Default return empty array if no matches found
			return [];
		},
		[matches, menuParentKeys],
	);

	const menuInlineCollapsedProp = useMemo(() => {
		/* inlineCollapsed is only available in inline mode */
		if (mode === "inline") {
			return { inlineCollapsed: isMobile ? false : sidebarCollapsed };
		}
		return {};
	}, [mode, isMobile, sidebarCollapsed]);

	const handleOpenChange: MenuProps["onOpenChange"] = (keys) => {
		/**
		 * 1. In accordion mode, clicking a menu item automatically closes other menus
		 * 2. In non-accordion mode with a collapsed menu, hovering over a menu automatically closes other menus
		 *
		 * Why not use the code from the antd menu example:
		 * @see https://ant.design/components/menu-cn#menu-demo-sider-current
		 * Reason: if multiple menus are opened in non-accordion mode and then it switches to accordion mode, clicking a menu item won't automatically close the other menus
		 */
		if (accordion || sidebarCollapsed) {
			const currentOpenKey = keys.find(key => !openKeys.includes(key));
			// open
			if (currentOpenKey !== undefined) {
				const parentKeys = menuParentKeys[currentOpenKey] || [];
				setOpenKeys([...parentKeys, currentOpenKey]);
			}
			else {
				const currentCloseKey = openKeys.find(key => !keys.includes(key));
				// close
				if (currentCloseKey) {
					setOpenKeys(menuParentKeys[currentCloseKey]);
				}
			}
		}
		else {
			setOpenKeys(keys);
		}
	};

	const menuOpenProps = useMemo(() => {
		// If accordion mode is enabled, the menu needs to auto-expand
		if (autoExpandCurrentMenu) {
			return {
				openKeys,
				onOpenChange: handleOpenChange,
			};
		}
		return {};
	}, [autoExpandCurrentMenu, openKeys, handleOpenChange]);

	/**
	 * When the side menu expands, automatically expand the active menu
	 * When the side menu collapses, automatically close all active menus
	 * @see https://github.com/user-attachments/assets/df2d7b63-acf4-4faa-bea6-7616b7e69621
	 */
	useEffect(() => {
		// Collapse
		if (sidebarCollapsed) {
			setOpenKeys([]);
		}
		// Expand
		else {
			// Accordion mode, only expand the currently active menu
			if (accordion) {
				setOpenKeys(getSelectedKeys);
			}
			// Non-accordion mode, expand all active menus
			else {
				setOpenKeys((prevOpenKeys) => {
					if (prevOpenKeys.length === 0) {
						return getSelectedKeys;
					}
					return prevOpenKeys;
				});
			}
		}
	}, [matches, sidebarCollapsed, getSelectedKeys]);

	return (
		<Menu
			/**
			 * min-w-0 flex-auto solves the issue where Menu doesn't responsively truncate as expected in a Flex layout
			 * @see https://ant-design.antgroup.com/components/menu#why-menu-do-not-responsive-collapse-in-flex-layout
			 */
			className={cn(
				"!border-none min-w-0 flex-auto",
				{
					/**
					 * When the side menu is collapsed, add background color
					 */
					[classes.menuBackgroundColor]: sidebarCollapsed,
				},
			)}
			inlineIndent={16}
			{...menuInlineCollapsedProp}
			style={{ height: isMobile ? "100%" : "initial" }}
			mode={mode}
			theme={isDark ? "dark" : sidebarTheme}
			items={menus as MenuProps["items"]}
			{...menuOpenProps}
			selectedKeys={getSelectedKeys}
			/**
			 * Use the onClick event instead of onSelect because when a child route activates the parent menu, clicking the parent menu should still navigate normally.
			 * @see https://github.com/user-attachments/assets/cf67a973-f210-45e4-8278-08727ab1b8ce
			 */
			onClick={({ key }) => handleMenuSelect?.(key, mode)}
		/>
	);
}
