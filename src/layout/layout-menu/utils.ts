import type { ReactElement } from "react";

import type { MenuItemType } from "./types";
import { cloneElement, isValidElement } from "react";
import { isString } from "#src/utils/is";

/**
 * Convert all labels in the menu tree to internationalized text
 * @param menus original menu array
 * @param t Translation function
 * @returns the converted menu array
 */
export function translateMenus(menus: MenuItemType[], t: (key: string) => string): MenuItemType[] {
	return menus.map((menu) => {
		let translatedLabel: React.ReactNode = menu.label;
		if (isValidElement(menu.label)) {
			const translatedChildren = t((menu.label as ReactElement<{ children: string }>).props.children);
			translatedLabel = cloneElement(menu.label, {}, translatedChildren ?? "");
		}
		if (isString(menu.label)) {
			translatedLabel = t(menu.label);
		}
		const translatedMenu = {
			...menu,
			label: translatedLabel,
		};

		if (menu.children && menu.children.length > 0) {
			translatedMenu.children = translateMenus(menu.children, t);
		}

		return translatedMenu;
	});
}

/**
 * Find a menu by path
 *
 * @param list menu list
 * @param path menu path
 * @returns the found menu object, or null if not found
 */
export function findMenuByPath(
	list: MenuItemType[],
	path?: string,
): MenuItemType | null {
	for (const menu of list) {
		if (menu.key === path) {
			return menu;
		}
		const findMenu = menu.children && findMenuByPath(menu.children, path);
		if (findMenu) {
			return findMenu;
		}
	}
	return null;
}

/**
 * Find the root menu by path
 *
 * @param menus menu list
 * @param path menu path, optional
 * @returns an object containing the found menu, root menu, and root menu path
 */
export function findRootMenuByPath(menus: MenuItemType[], path?: string): {
	findMenu: MenuItemType | null
	rootMenu: MenuItemType | null
	rootMenuPath: string | null
} {
	// Initialize the return values
	let findMenu: MenuItemType | null = null;
	let rootMenu: MenuItemType | null = null;
	let rootMenuPath: string | null = null;

	// If no path is provided, return the default values
	if (!path) {
		return {
			findMenu: null,
			rootMenu: null,
			rootMenuPath: null,
		};
	}

	// Recursive lookup function
	const find = (
		list: MenuItemType[],
		targetPath: string,
		parents: MenuItemType[] = [],
	): boolean => {
		for (const menu of list) {
			// If the target menu is found
			if (menu.key === targetPath) {
				findMenu = menu;
				// If there is no parent menu, the current menu is the root menu
				if (parents.length === 0) {
					rootMenu = menu;
					rootMenuPath = menu.key;
				}
				else {
					// Get the top-most parent menu
					rootMenu = parents[0];
					rootMenuPath = parents[0].key;
				}
				return true;
			}

			// If there are submenus, continue the recursive lookup
			if (menu.children && menu.children.length > 0) {
				// Add the current menu to the parent menu array
				const found = find(menu.children, targetPath, [...parents, menu]);
				if (found) {
					return true;
				}
			}
		}
		return false;
	};

	// Start the lookup
	find(menus, path);

	return {
		findMenu,
		rootMenu,
		rootMenuPath,
	};
}

/**
 * Recursively find the first menu item at the deepest level under the first submenu path
 *
 * @param splitSideNavItems menu list
 * @returns the found first menu item at the deepest level
 */
export function findDeepestFirstItem(splitSideNavItems: MenuItemType[]): MenuItemType | null {
	// If the list is empty, return null
	if (!splitSideNavItems || splitSideNavItems.length === 0) {
		return null;
	}

	// Get the first menu item
	const firstItem = splitSideNavItems[0];

	// If the current item has submenus, continue the recursive lookup
	if (firstItem.children && firstItem.children.length > 0) {
		return findDeepestFirstItem(firstItem.children);
	}

	// If there are no more submenus, the deepest level has been reached, so return the current item
	return firstItem;
}

/**
 * Get all keys in the menu items and their corresponding levels
 *
 * @param menuItems1 array of menu items
 * @returns an object whose keys are the menu item keys and values are the menu item levels
 */
export function getLevelKeys(menuItems1: MenuItemType[]) {
	const key: Record<string, number> = {};
	const func = (menuItems2: MenuItemType[], level = 1) => {
		menuItems2.forEach((item) => {
			if (item.key) {
				key[item.key] = level;
			}
			if (item.children) {
				func(item.children, level + 1);
			}
		});
	};
	func(menuItems1);
	return key;
};

/**
 * Get the parent keys of the menu items
 *
 * @param menuItems array of menu items
 * @returns an object recording the array of parent keys corresponding to each menu item key
 */
export function getParentKeys(menuItems: MenuItemType[]): Record<string, string[]> {
	const parentKeyMap: Record<string, string[]> = {};

	function traverse(items: MenuItemType[], parentKeys: string[] = []) {
		for (const item of items) {
			// Record the parent key array of the current key
			parentKeyMap[item.key] = [...parentKeys];

			// If there are child nodes, traverse recursively
			if (Array.isArray(item.children) && item.children.length) {
				traverse(item.children, [...parentKeys, item.key]);
			}
		}
	}

	traverse(menuItems);
	return parentKeyMap;
}
