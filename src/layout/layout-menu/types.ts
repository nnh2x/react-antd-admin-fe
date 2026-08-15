/**
 * Menu item type
 */
export interface MenuItemType {
	/**
	 * Menu path, the unique identifier of the item
	 */
	key: string
	/**
	 * Menu item title
	 */
	label: React.ReactNode
	/**
	 * Submenu items
	 */
	children?: MenuItemType[]
	/**
	 * Menu icon
	 */
	icon?: React.ReactNode
	/**
	 * Whether the menu is disabled
	 * @default false
	 */
	disabled?: boolean
}
