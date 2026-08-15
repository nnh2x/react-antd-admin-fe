import type { MenuProps } from "antd";
import {
	CloseOutlined,
	RedoOutlined,
	SwapOutlined,
	VerticalAlignBottomOutlined,
	VerticalAlignMiddleOutlined,
	VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { useKeepAliveContext } from "keepalive-for-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useTabsStore } from "#src/store/tabs";

const homePath = import.meta.env.VITE_BASE_HOME_PATH;
/**
 * Key-value object for tab actions
 * @readonly
 * @enum {string}
 * @property {string} REFRESH - reload the current tab
 * @property {string} CLOSE - close the current tab
 * @property {string} CLOSE_RIGHT - close tabs to the right
 * @property {string} CLOSE_LEFT - close tabs to the left
 * @property {string} CLOSE_OTHERS - close other tabs
 * @property {string} CLOSE_ALL - close all tabs
 */
export const TabActionKeys = {
	REFRESH: "refresh",
	CLOSE: "close",
	CLOSE_RIGHT: "closeRight",
	CLOSE_LEFT: "closeLeft",
	CLOSE_OTHERS: "closeOthers",
	CLOSE_ALL: "closeAll",
} as const;

export type TabActionKey = typeof TabActionKeys[keyof typeof TabActionKeys];

/**
 * Custom hook for handling the tab's dropdown menu
 * @returns {[Function, Function]} a tuple containing the menu item generator function and the menu click handler function
 */
export function useDropdownMenu() {
	const { t } = useTranslation();
	const {
		openTabs,
		activeKey,
		removeTab,
		closeLeftTabs,
		closeRightTabs,
		closeOtherTabs,
		closeAllTabs,
		setIsRefresh,
	} = useTabsStore();
	const { refresh } = useKeepAliveContext();
	/**
	 * Generate menu items
	 * @param {string} tabKey - the key of the current tab
	 * @returns {MenuProps["items"]} menu item configuration
	 */
	const items = useCallback((tabKey: string): MenuProps["items"] => {
		const isOnlyTab = openTabs.size === 2 && openTabs.has(homePath);
		const isLastTab = Array.from(openTabs.keys()).pop() === tabKey;
		return [
			{
				key: TabActionKeys.REFRESH,
				icon: <RedoOutlined rotate={270} />,
				label: t("preferences.tabbar.contextMenu.refresh"),
				disabled: activeKey !== tabKey,
			},
			{
				key: TabActionKeys.CLOSE,
				icon: <CloseOutlined />,
				label: t("preferences.tabbar.contextMenu.close"),
				disabled: tabKey === homePath,
			},
			{ type: "divider" },
			{
				key: TabActionKeys.CLOSE_LEFT,
				icon: <VerticalAlignBottomOutlined rotate={90} />,
				label: t("preferences.tabbar.contextMenu.closeLeft"),
				disabled: tabKey === homePath || isOnlyTab,
			},
			{
				key: TabActionKeys.CLOSE_RIGHT,
				icon: <VerticalAlignTopOutlined rotate={90} />,
				label: t("preferences.tabbar.contextMenu.closeRight"),
				disabled: tabKey === homePath || isOnlyTab || isLastTab,
			},
			{ type: "divider" },
			{
				key: TabActionKeys.CLOSE_OTHERS,
				icon: <VerticalAlignMiddleOutlined rotate={90} />,
				label: t("preferences.tabbar.contextMenu.closeOthers"),
				disabled: tabKey === homePath || isOnlyTab,
			},
			{
				key: TabActionKeys.CLOSE_ALL,
				icon: <SwapOutlined />,
				label: t("preferences.tabbar.contextMenu.closeAll"),
				disabled: tabKey === homePath,
			},
		];
	}, [t, activeKey, homePath, openTabs]);

	/**
	 * Define menu actions and their corresponding handler functions
	 */
	const actions = useMemo(() => ({
		[TabActionKeys.REFRESH]: (currentPath: string) => {
			// Refresh the KeepAlive cached page
			refresh(currentPath);
			// Re-render the page
			setIsRefresh(true);
		},
		[TabActionKeys.CLOSE]: removeTab,
		[TabActionKeys.CLOSE_RIGHT]: closeRightTabs,
		[TabActionKeys.CLOSE_LEFT]: closeLeftTabs,
		[TabActionKeys.CLOSE_OTHERS]: closeOtherTabs,
		[TabActionKeys.CLOSE_ALL]: closeAllTabs,
	}), [removeTab, closeRightTabs, closeLeftTabs, closeOtherTabs, closeAllTabs]);

	/**
	 * Handle the menu click event
	 * @param {string} menuKey - the key of the clicked menu item
	 * @param {string} nodeKey - the key of the current tab
	 */
	const onClickMenu = useCallback((menuKey: string, nodeKey: string) => {
		const action = actions[menuKey as keyof typeof actions];
		if (action) {
			action(nodeKey);
		}
	}, [actions]);

	return [items, onClickMenu] as const;
}
