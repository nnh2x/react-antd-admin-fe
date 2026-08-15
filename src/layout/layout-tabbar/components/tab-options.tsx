import type { MenuProps } from "antd";

import { DownOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";

import { useState } from "react";
import { BasicButton } from "#src/components/basic-button";
import { cn } from "#src/utils/cn";

import { useDropdownMenu } from "../hooks/use-dropdown-menu";

/**
 * Props interface of the TabOptions component
 * @interface TabOptionsProps
 * @property {string} activeKey - the key of the currently active tab
 */
interface TabOptionsProps {
	activeKey: string
	className?: string
}

/**
 * TabOptions component
 * Used to display the tab's action options dropdown menu
 * @param {TabOptionsProps} props - component props
 * @returns {JSX.Element} the TabOptions component
 */
export function TabOptions({ activeKey, className }: TabOptionsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [items, onClickMenu] = useDropdownMenu();

	/**
	 * Handle the display state change of the dropdown menu
	 * @param {boolean} open - whether the menu is open
	 */
	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
	};

	/**
	 * Handle the menu item click event
	 * @param {object} param - click event parameters
	 * @param {string} param.key - the key of the clicked menu item
	 */
	const onClick: MenuProps["onClick"] = ({ key }) => {
		onClickMenu(key, activeKey);
		setIsOpen(false);
	};

	return (
		<Dropdown
			trigger={["click"]}
			menu={{ items: items(activeKey), onClick }}
			open={isOpen}
			onOpenChange={onOpenChange}
		>
			<BasicButton
				className={cn(className)}
				size="middle"
				type="text"
				icon={<DownOutlined />}
			/>
		</Dropdown>
	);
}
