import type { MenuItemType } from "#src/layout/layout-menu/types";
import type { AppRouteRecordRaw } from "#src/router/types";

import { createElement } from "react";
import { Link } from "react-router";

import { menuIcons } from "#src/icons/menu-icons";
import { isString } from "#src/utils/is";

/**
 * Generates a menu item array based on the route list
 *
 * @param routeList Route list, of type AppRouteRecordRaw array
 * @returns Returns a menu item array, with array elements of type MenuItemType
 */
export function generateMenuItemsFromRoutes(routeList: AppRouteRecordRaw[]) {
	return routeList.reduce<MenuItemType[]>((acc, item) => {
		const label = item.handle?.title;
		const externalLink = item?.handle?.externalLink;
		const iconName = item?.handle?.icon;

		const menuItem: MenuItemType = {
			key: item.path!,
			label: externalLink
				? createElement(
					Link,
					{
						// Stop event propagation to prevent triggering the menu's click event
						onClick: (e) => {
							e.stopPropagation();
						},
						to: externalLink,
						target: "_blank",
						rel: "noopener noreferrer",
					},
					label,
				)
				: (
					label
				),
		};
		if (iconName) {
			menuItem.icon = iconName;
			if (isString(iconName)) {
				if (menuIcons[iconName]) {
					menuItem.icon = createElement(menuIcons[iconName]);
				}
				else {
					console.warn(
						`menu-icon: icon "${iconName}" not found in src/icons/menu-icons.ts file`,
					);
				}
			}
		}
		if (Array.isArray(item.children) && item.children.length > 0) {
			// Filter out routes that are not the index route and are not shown in the menu
			const noIndexRoute = item.children.filter(route => !route.index && !route?.handle?.hideInMenu);
			if (noIndexRoute.length > 0) {
				menuItem.children = generateMenuItemsFromRoutes(noIndexRoute);
			}
		}
		if (item?.handle?.hideInMenu) {
			return acc;
		}
		return [...acc, menuItem];
	}, []);
}
