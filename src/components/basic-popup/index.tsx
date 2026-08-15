import type { PopoverProps } from "antd";
import type { ReactElement } from "react";

import { Popover } from "antd";
import { useState } from "react";

export interface BasicPopupProps extends Omit<PopoverProps, "children" | "onOpenChange" | "open"> {
	/** Element receiving the popup interaction handlers. */
	children: ReactElement
	/** Controlled open state. */
	open?: boolean
	/** Initial open state when the popup is uncontrolled. */
	defaultOpen?: boolean
	/** Called whenever the open state changes. */
	onOpenChange?: (open: boolean) => void
}

/**
 * Popover with consistent controlled/uncontrolled state management.
 */
export function BasicPopup({
	children,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	placement = "bottomRight",
	trigger = "click",
	...popoverProps
}: BasicPopupProps) {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const open = controlledOpen ?? internalOpen;

	function handleOpenChange(nextOpen: boolean) {
		if (controlledOpen === undefined) {
			setInternalOpen(nextOpen);
		}
		onOpenChange?.(nextOpen);
	}

	return (
		<Popover
			{...popoverProps}
			open={open}
			placement={placement}
			trigger={trigger}
			onOpenChange={handleOpenChange}
		>
			{children}
		</Popover>
	);
}
