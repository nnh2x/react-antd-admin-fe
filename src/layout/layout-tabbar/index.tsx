import type { TabsProps } from "antd";
import type { ReactElement } from "react";
import type { TabItemProps } from "#src/store/tabs";

import { RedoOutlined } from "@ant-design/icons";
import { Button, Tabs } from "antd";
import { clsx } from "clsx";
import { isValidElement, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useLocation, useNavigate } from "react-router";
import { useCurrentRoute } from "#src/hooks/use-current-route";
import { removeTrailingSlash } from "#src/router/utils/remove-trailing-slash";
import { useAccessStore } from "#src/store/access";
import { usePreferencesStore } from "#src/store/preferences";
import { useTabsStore } from "#src/store/tabs";
import { isString } from "#src/utils/is";

import { tabbarHeight } from "../constants";
import { DraggableTabBar } from "./components/draggable-tab-bar";
import { TabMaximize } from "./components/tab-maximize";
import { TabOptions } from "./components/tab-options";
import { TabActionKeys, useDropdownMenu } from "./hooks/use-dropdown-menu";
import { useStyles } from "./style";

/**
 * LayoutTabbar component
 * Used to render and manage the application's tab navigation
 */
export default function LayoutTabbar() {
	// const { token } = theme.useToken();
	const classes = useStyles();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const currentRoute = useCurrentRoute();

	const { tabbarStyleType, tabbarShowMaximize, tabbarShowMore } = usePreferencesStore();
	const { flatRouteList } = useAccessStore();
	const { activeKey, isRefresh, setActiveKey, setIsRefresh, openTabs, addTab, insertBeforeTab } = useTabsStore();
	const [items, onClickMenu] = useDropdownMenu();

	const tabItems: TabItemProps[] = Array.from(openTabs.values()).map((item) => {
		const tabLabel = item.newTabTitle ?? item.label;
		return {
			...item,
			label: (
				<div className="relative flex items-center gap-1">
					{isString(tabLabel) ? t(tabLabel) : tabLabel}
				</div>
			),
		};
	});

	/**
	 * Automatically reset the refresh state
	 */
	useEffect(() => {
		if (isRefresh) {
			const timer = setTimeout(() => {
				setIsRefresh(false);
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [isRefresh, setIsRefresh]);

	/**
	 * Handle tab switching
	 * @param {string} key - the key of the selected tab
	 */
	const handleChangeTabs = useCallback((key: string) => {
		const historyState = openTabs.get(key)?.historyState || { search: "", hash: "" };
		navigate(key + historyState.search + historyState.hash);
	}, [openTabs]);

	/**
	 * Handle tab editing (closing)
	 * @param {React.MouseEvent | React.KeyboardEvent | string} key - the key of the edited tab
	 * @param {string} action - the edit action, only "remove" is handled here
	 */
	const handleEditTabs = useCallback<Required<TabsProps>["onEdit"]>((key, action) => {
		if (action === "remove") {
			onClickMenu(TabActionKeys.CLOSE, key as string);
		}
	}, [onClickMenu]);

	/**
	 * Custom-render the tab bar, adding right-click menu functionality
	 * @param {object} tabBarProps - tab bar props
	 * @param {React.ComponentType} DefaultTabBar - the default tab bar component
	 * @returns {JSX.Element} the rendered tab bar
	 */
	const renderTabBar = useCallback<Required<TabsProps>["renderTabBar"]>((tabBarProps, DefaultTabBar) => {
		return (
			<DraggableTabBar
				DefaultTabBar={DefaultTabBar}
				tabBarProps={tabBarProps}
				items={items}
				tabItems={tabItems}
				onClickMenu={onClickMenu}
			/>
		);
	}, [tabItems, items, onClickMenu]);

	/**
	 * Generate extra content for the tab bar
	 */
	const tabBarExtraContent = useMemo(() => ({
		right: (
			<div className="flex items-center" style={{ height: tabbarHeight }}>
				<Button
					icon={(
						<RedoOutlined
							rotate={270}
							className={clsx({ "animate-spin": isRefresh })}
						/>
					)}
					size="middle"
					type="text"
					className={clsx("rounded-none h-full border-l border-l-colorBorderSecondary")}
					onClick={() => onClickMenu(TabActionKeys.REFRESH, activeKey)}
				/>
				{tabbarShowMaximize ? (<TabMaximize className="h-full border-l rounded-none border-l-colorBorderSecondary" />) : null}
				{tabbarShowMore ? (<TabOptions activeKey={activeKey} className="h-full border-l rounded-none border-l-colorBorderSecondary" />) : null}
			</div>
		),
	}), [isRefresh, activeKey, onClickMenu, tabbarShowMore, tabbarShowMaximize]);

	/**
	 * When the active tab is closed, automatically navigate to the appropriate route
	 *
	 * Warning: except for the first time entering the system (e.g. login), consistently use navigate(import.meta.env.VITE_BASE_HOME_PATH) in the project instead of navigate("/") directly, for the following reasons:
	 * 1. Navigating directly to the root path ("/") causes the router root component to re-render
	 * 2. This component will then fail to correctly listen for location changes
	 * 3. This causes the activeKey state to remain stuck at the previous active tab (visual glitch)
	 * 4. As a result, location.pathname is new but the activeKey state is still the previous active tab, causing a navigation glitch.
	 */
	useEffect(() => {
		/**
		 * The following actions trigger the active tab being closed:
		 * 1. Closing the current tab
		 * 2. When using the close left/right/other/all tabs feature, the active tab gets closed
		 *
		 * At this point activeKey is up to date but location.pathname hasn't updated yet, so use navigate to go to the latest active tab to prevent a visual glitch.
		 *
		 * On first entering the app, activeKey is empty, so auto-navigation is not triggered
		 */
		const historyState = openTabs.get(activeKey)?.historyState || { search: "", hash: "" };
		const activeFullPath = activeKey + historyState.search + historyState.hash;
		const currentFullpath = location.pathname + location.search + location.hash;
		if (activeKey.length > 0 && activeFullPath !== currentFullpath) {
			navigate(activeFullPath);
		}
	}, [activeKey]);

	/**
	 * When the user refreshes the current page and it is not the default tab page, the default tab needs to be added
	 */
	useEffect(() => {
		// Check whether the default tab is missing
		const isDefaultTabMissing = !Array.from(openTabs.keys()).includes(import.meta.env.VITE_BASE_HOME_PATH);

		if (isDefaultTabMissing) {
			const routeTitle = flatRouteList[import.meta.env.VITE_BASE_HOME_PATH]?.handle?.title as string;
			insertBeforeTab(import.meta.env.VITE_BASE_HOME_PATH, {
				key: import.meta.env.VITE_BASE_HOME_PATH,
				label: isValidElement(routeTitle) ? (routeTitle as ReactElement<{ children: string }>).props?.children : routeTitle,
				closable: false,
				draggable: false,
			});
		}
	}, [openTabs, insertBeforeTab, flatRouteList]);

	/**
	 * Listen for route changes, add tabs, and activate tabs
	 */
	useEffect(() => {
		const activePath = location.pathname;
		const normalizedPath = removeTrailingSlash(activePath);
		// The tabbarEnable variable causes this component to mount and unmount; normalizedPath may equal activeKey, so add this check to prevent addTab from adding duplicates
		if (normalizedPath !== activeKey) {
			setActiveKey(normalizedPath);

			const routeTitle = currentRoute.handle?.title as string;

			addTab(normalizedPath, {
				key: normalizedPath,
				// Ensure label is of type string, so it can be stored in sessionStorage.
				label: isValidElement(routeTitle) ? (routeTitle as ReactElement<{ children: string }>)?.props?.children : routeTitle,
				historyState: { search: location.search, hash: location.hash },
				/* The default route navigated to after login cannot be closed or dragged */
				closable: normalizedPath !== import.meta.env.VITE_BASE_HOME_PATH,
				draggable: normalizedPath !== import.meta.env.VITE_BASE_HOME_PATH,
			});
		}
	}, [location, currentRoute, setActiveKey, addTab]);

	return (
		<div className={classes.tabsContainer}>
			<Tabs
				className={clsx(
					classes.resetTabs,
					tabbarStyleType === "brisk" ? classes.brisk : "",
					tabbarStyleType === "plain" ? classes.plain : "",
					tabbarStyleType === "chrome" ? classes.chrome : "",
					tabbarStyleType === "card" ? classes.card : "",
				)}
				size="small"
				hideAdd
				animated
				onChange={handleChangeTabs}
				activeKey={removeTrailingSlash(activeKey)}
				type="editable-card"
				onEdit={handleEditTabs}
				items={tabItems}
				renderTabBar={renderTabBar}
				tabBarExtraContent={tabBarExtraContent}
			/>
		</div>
	);
}
