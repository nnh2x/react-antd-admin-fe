import type { TabPaneProps } from "antd";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { usePreferencesStore } from "#src/store/preferences";
import { getAppNamespace } from "#src/utils/get-app-namespace";

/**
 * Tab item properties interface.
 */
export interface TabItemProps extends Omit<TabPaneProps, "tab"> {
	key: string
	label: React.ReactNode
	/**
	 * Whether it can be dragged.
	 */
	draggable?: boolean
	/**
	 * Optional history state values, such as search and hash, can be stored here.
	 * This state can be accessed in the target route via the useLocation hook.
	 * @see {@link https://reactrouter.com/en/main/hooks/use-navigate#optionsstate | usenavigate - options state}
	 */
	historyState?: Record<string, any>
}

export interface TabStateType extends Omit<TabItemProps, "label"> {
	label: string
	/**
	 * The new title of the tab, used to modify the title of the tab.
	 */
	newTabTitle?: React.ReactNode
}

/**
 * Initial state.
 */
const initialState = {
	/**
	 * Tab collection.
	 */
	openTabs: new Map<string, TabStateType>([]),
	/**
	 * The currently active tab.
	 */
	activeKey: "",
	/**
	 * Whether it is in a refresh state.
	 */
	isRefresh: false,
	/**
	 * Whether the tab is maximized.
	 */
	isMaximize: false,
};

type TabsState = typeof initialState;

/**
 * Tab operation methods.
 */
interface TabsAction {
	setIsRefresh: (state: boolean) => void
	addTab: (routePath: string, tabProps: TabStateType) => void
	insertBeforeTab: (routePath: string, tabProps: TabStateType) => void
	removeTab: (routePath: string) => void
	closeRightTabs: (routePath: string) => void
	closeLeftTabs: (routePath: string) => void
	closeOtherTabs: (routePath: string) => void
	closeAllTabs: () => void
	setActiveKey: (routePath: string) => void
	resetTabs: () => void
	changeTabOrder: (from: number, to: number) => void
	toggleMaximize: (state: boolean) => void
	setTableTitle: (routePath: string, title: string) => void
	resetTableTitle: (routePath: string) => void
};

/**
 * Tab state management.
 */
export const useTabsStore = create<TabsState & TabsAction>()(
	persist(
		set => ({
			...initialState,

			/**
			 * Set whether the tab is in a refresh state.
			 */
			setIsRefresh: (state: boolean) => {
				set({ isRefresh: state });
			},

			/**
			 * Set the tab.
			 */
			setActiveKey: (routePath: string) => {
				set({ activeKey: routePath });
			},

			/**
			 * Insert a tab at the front.
			 */
			insertBeforeTab: (routePath: string, tabProps: TabStateType) => {
				set((state) => {
					if (routePath.length) {
						const newMap = new Map([[routePath, tabProps]]);
						for (const [key, value] of state.openTabs) {
							newMap.set(key, value);
						}
						return { openTabs: newMap };
					}
					return state;
				});
			},

			/**
			 * Add a tab.
			 */
			addTab: (routePath: string, tabProps: TabStateType) => {
				set((state) => {
					if (routePath.length) {
						const newTabs = new Map(state.openTabs);
						/**
						 * 1. If the tab already exists, update its historyState property, so it is not deduplicated; ...newTabs.get(routePath) ensures the home tab's closable property is not overwritten.
						 * 2. If the tab does not exist, add it to the Map.
						 */
						newTabs.set(routePath, { ...newTabs.get(routePath), ...tabProps });
						return { openTabs: newTabs };
					}
					return state;
				});
			},

			/**
			 * Remove a tab.
			 */
			removeTab: (routePath: string) => {
				set((state) => {
					const homePath = import.meta.env.VITE_BASE_HOME_PATH;

					// Do not allow closing the home tab
					if (routePath === homePath) {
						return state;
					}

					const newTabs = new Map(state.openTabs);
					newTabs.delete(routePath);
					let newActiveKey = state.activeKey;

					// If the currently active tab is removed, select the last tab
					if (routePath === state.activeKey) {
						const tabsArray = Array.from(newTabs.keys());
						newActiveKey = tabsArray.at(-1) || homePath;
					}

					// Ensure at least the home tab is kept
					if (newTabs.size === 0) {
						newTabs.set(homePath, state.openTabs.get(homePath)!);
						newActiveKey = homePath;
					}

					return { openTabs: newTabs, activeKey: newActiveKey };
				});
			},

			/**
			 * Close tabs on the right.
			 */
			closeRightTabs: (routePath: string) => {
				set((state) => {
					const newTabs = new Map();
					let found = false;
					let activeKeyFound = false;
					let newActiveKey = state.activeKey;

					// Iterate over all current tabs
					for (const [key, value] of state.openTabs) {
						// Stop iterating once the target path is found
						if (found) {
							break;
						}
						// Add the current tab to the new Map
						newTabs.set(key, value);
						// If the current key matches the target path, mark it as found
						if (key === routePath) {
							found = true;
						}
						// If the current key matches the currently active tab, mark activeKey as found
						if (key === state.activeKey) {
							activeKeyFound = true;
						}
					}

					// If the currently active tab was closed, set the new active tab to the target path
					if (!activeKeyFound) {
						newActiveKey = routePath;
					}

					// Return the updated state
					return { openTabs: newTabs, activeKey: newActiveKey };
				});
			},

			/**
			 * Close tabs on the left.
			 */
			closeLeftTabs: (routePath: string) => {
				set((state) => {
					const newTabs = new Map();
					const homePath = import.meta.env.VITE_BASE_HOME_PATH;
					let found = false;
					let newActiveKey = state.activeKey;
					let activeKeyOnRight = false;

					// Add the home tab first, since it cannot be removed
					newTabs.set(homePath, state.openTabs.get(homePath)!);

					// Iterate over all current tabs
					for (const [key, value] of state.openTabs) {
						if (key === homePath)
							continue; // Skip the home tab since it was already added

						if (found || key === routePath) {
							newTabs.set(key, value);
							found = true;
						}

						if (key === state.activeKey && found) {
							activeKeyOnRight = true;
						}
					}

					// If the currently active tab was closed on the left, set the new active tab to the target path
					if (!activeKeyOnRight) {
						newActiveKey = routePath;
					}

					// Return the updated state
					return { openTabs: newTabs, activeKey: newActiveKey };
				});
			},

			/**
			 * Close other tabs.
			 */
			closeOtherTabs: (routePath: string) => {
				set((state) => {
					const newTabs = new Map();
					const homePath = import.meta.env.VITE_BASE_HOME_PATH;

					// Keep the home tab
					newTabs.set(homePath, state.openTabs.get(homePath)!);

					// Keep the specified tab
					if (routePath !== homePath && state.openTabs.has(routePath)) {
						newTabs.set(routePath, state.openTabs.get(routePath)!);
					}

					// Update the active tab
					let newActiveKey = state.activeKey;
					if (!newTabs.has(state.activeKey)) {
						newActiveKey = routePath;
					}

					return { openTabs: newTabs, activeKey: newActiveKey };
				});
			},

			/**
			 * Close all tabs.
			 */
			closeAllTabs: () => {
				set((state) => {
					const newTabs = new Map();
					const homePath = import.meta.env.VITE_BASE_HOME_PATH;
					newTabs.set(homePath, state.openTabs.get(homePath)!);
					return { openTabs: newTabs, activeKey: homePath };
				});
			},

			/**
			 * Change tab order.
			 */
			changeTabOrder: (from: number, to: number) => {
				set((state) => {
					// You could also use import { arrayMove } from "@dnd-kit/sortable"; to swap positions
					const newTabs = Array.from(state.openTabs.entries());
					const [movedTab] = newTabs.splice(from, 1); // Destructure directly to get the moved tab
					newTabs.splice(to, 0, movedTab); // Insert at the new position

					const newOpenTabs = new Map(newTabs); // Use the Map constructor directly
					return { openTabs: newOpenTabs };
				});
			},

			/**
			 * Toggle tab maximization status
			 * @param {boolean} state - Maximization state
			 */
			toggleMaximize: (state: boolean) => {
				set({ isMaximize: state });
			},

			/**
			 * Set the tab title
			 */
			setTableTitle: (routePath: string, title: React.ReactNode) => {
				set((state) => {
					const newTabs = new Map(state.openTabs);
					const targetTab = newTabs.get(routePath);
					if (targetTab) {
						targetTab.newTabTitle = title;
						newTabs.set(routePath, targetTab);
						return { openTabs: newTabs };
					}
					return state;
				});
			},

			/**
			 * Reset the tab title (delete custom titles)
			 */
			resetTableTitle: (routePath: string) => {
				set((state) => {
					const newTabs = new Map(state.openTabs);
					const targetTab = newTabs.get(routePath);
					if (targetTab) {
						delete targetTab.newTabTitle;
						newTabs.set(routePath, targetTab);
						return { openTabs: newTabs };
					}
					return state;
				});
			},

			/**
			 * Reset all tab states
			 */
			resetTabs: () => {
				set(() => {
					return { ...initialState };
				});
			},

		}),
		{
			name: getAppNamespace("tabbar"),
			/**
			 * activeKey does not need to be persisted.
			 *
			 * Suppose the page route is /home
			 * and the user manually types /about into the address bar.
			 * If activeKey remained /home, it would break the automatic navigation feature in src/layout/layout-tabbar/index.tsx.
			 * @see https://github.com/condorheroblog/react-antd-admin/issues/1
			 */
			partialize: (state) => {
				return Object.fromEntries(
					Object.entries(state).filter(([key]) => !["activeKey"].includes(key)),
				);
			},
			/**
			 * openTabs is a Map, so persistent storage needs to be managed manually.
			 * How do I use it with Map and Set
			 * @see https://github.com/pmndrs/zustand/blob/v5.0.1/docs/integrations/persisting-store-data.md#how-do-i-use-it-with-map-and-set
			 */
			storage: {
				getItem: (name) => {
					const str = sessionStorage.getItem(name);
					// Whether persistent storage is enabled; if not, return null on initial page load
					const isPersist = usePreferencesStore.getState().tabbarPersist;
					if (!str || !isPersist)
						return null;
					const existingValue = JSON.parse(str);
					return {
						...existingValue,
						state: {
							...existingValue.state,
							openTabs: new Map(existingValue.state.openTabs),
						},
					};
				},
				setItem: (name, newValue) => {
					// functions cannot be JSON encoded
					const str = JSON.stringify({
						...newValue,
						state: {
							...newValue.state,
							openTabs: Array.from(newValue.state.openTabs.entries()),
						},
					});
					sessionStorage.setItem(name, str);
				},
				removeItem: name => sessionStorage.removeItem(name),
			},
		},
	),

);
