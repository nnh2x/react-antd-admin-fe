import type { MenuProps } from "antd";

import type {
	MIXED_NAVIGATION,
	SIDE_NAVIGATION,
	TOP_NAVIGATION,
	TWO_COLUMN_NAVIGATION,
} from "#src/layout/widgets/preferences/blocks/layout/constants";
import type { LanguageType } from "#src/locales";

/**
 * Login page layout
 */
export type PageLayoutType = "layout-left" | "layout-center" | "layout-right";
/**
 * Tabbar style
 */
export type TabsStyleType = "brisk" | "card" | "chrome" | "plain";

/**
 * Theme type
 */
export type ThemeType = "dark" | "light" | "auto";

/**
 * Animation state
 */
interface AnimationState {
	/**
	 * Whether to enable transition animation
	 * @default true
	 */
	transitionProgress: boolean
	/**
	 * Whether to enable loading animation
	 * @default true
	 */
	transitionLoading: boolean
	/**
	 * Whether to enable animation
	 * @default true
	 */
	transitionEnable: boolean
	/**
	 * Transition animation name
	 * @default "fade-slide"
	 */
	transitionName: string
}

export type NavigationType = typeof SIDE_NAVIGATION | typeof TOP_NAVIGATION | typeof TWO_COLUMN_NAVIGATION | typeof MIXED_NAVIGATION;
export type BuiltinThemeType = "red" | "volcano" | "orange" | "gold" | "yellow" | "lime" | "green" | "cyan" | "blue" | "geekblue" | "purple" | "magenta" | "gray" | "custom";

interface LayoutState {
	navigationStyle: NavigationType
}

export interface GeneralState {
	/**
	 * Whether to enable watermark
	 * @default false
	 */
	watermark: boolean
	/**
	 * Watermark content
	 * @default ""
	 */
	watermarkContent: string
	/**
	 * BackTop makes it easy to go back to the top of the page.
	 * @default true
	 */
	enableBackTopButton: boolean
	/**
	 * Login page layout configuration
	 * @default "layout-right"
	 */
	pageLayout: PageLayoutType
	/**
	 * Enable frontend route permissions
	 * @default false
	 */
	enableFrontendAceess: boolean
	/**
	 * Enable backend route permissions
	 * @default true
	 */
	enableBackendAccess: boolean

	/**
	 * Current language
	 * @default "vi-VN"
	 */
	language: LanguageType
	/**
	 * Whether to enable dynamic title
	 * @default true
	 */
	enableDynamicTitle: boolean
	/**
	 * Whether to enable update check
	 * @default true
	 */
	enableCheckUpdates: boolean
	/**
	 * Polling interval, in minutes (default: 1 minute)
	 * @default 1
	 */
	checkUpdatesInterval: number
}

export interface SidebarState {
	/**
	 * Whether the sidebar is visible
	 * @default true
	 */
	sidebarEnable?: boolean
	/**
	 * Sidebar menu width
	 * @default 210
	 */
	sidebarWidth: number
	/**
	 * Sidebar menu collapsed width
	 * @default 56
	 */
	sideCollapsedWidth: number
	/**
	 * Sidebar menu collapsed state
	 * @default false
	 */
	sidebarCollapsed: boolean
	/**
	 * Whether to show the title when the sidebar menu is collapsed
	 * @default true
	 */
	sidebarCollapseShowTitle: boolean
	/**
	 * Extra width of the collapsed sidebar menu
	 * @default 48
	 */
	sidebarExtraCollapsedWidth: number
	/**
	 * Width of the left menu column in the two-column layout
	 * @default 80
	 */
	firstColumnWidthInTwoColumnNavigation: number
	/**
	 * Sidebar theme
	 * @default dark
	 */
	sidebarTheme: MenuProps["theme"]
	/**
	 * Accordion mode of navigation menu
	 */
	accordion: boolean
}

export interface FooterState {
	enableFooter: boolean
	fixedFooter: boolean
	companyName: string
	companyWebsite: string
	copyrightDate: string
	ICPNumber: string
	ICPLink: string
}

export interface PreferencesState
	extends AnimationState,
	LayoutState,
	GeneralState,
	SidebarState,
	FooterState {
	/* ================== Theme ================== */
	/**
	 * Current theme
	 * @default "auto"
	 */
	theme: ThemeType
	/**
	 * Whether to enable color-blind mode
	 * @default false
	 */
	colorBlindMode: boolean
	/**
	 * Whether to enable gray mode
	 * @default false
	 */
	colorGrayMode: boolean
	/**
	 * Theme radius value
	 * @default 6
	 */
	themeRadius: number
	/**
	 * Theme color
	 * @default "#1677ff" - blue
	 */
	themeColorPrimary: string
	/**
	 * Builtin theme
	 * @default "blue"
	 */
	builtinTheme: BuiltinThemeType
	/* ================== Theme ================== */

	/* ================== Tabbar ================== */
	/**
	 * Tabbar style
	 * @default "chrome"
	 */
	tabbarStyleType: TabsStyleType
	/**
	 * Whether to enable tabbar
	 * @default true
	 */
	tabbarEnable: boolean
	/**
	 * Whether to show tabbar icon
	 * @default true
	 * @todo Not yet implemented
	 */
	tabbarShowIcon: boolean
	/**
	 * Whether to persist tabbar
	 * @default true
	 */
	tabbarPersist: boolean
	/**
	 * Whether to drag tabbar
	 * @default true
	 * @todo Not yet implemented
	 */
	tabbarDraggable: boolean
	/**
	 * Whether to show more
	 * @default true
	 */
	tabbarShowMore: boolean
	/**
	 * Whether to show maximize
	 * @default true
	 */
	tabbarShowMaximize: boolean
	/* ================== Tabbar ================== */
}
