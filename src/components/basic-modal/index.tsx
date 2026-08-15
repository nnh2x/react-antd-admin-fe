import type { ModalProps } from "antd";
import type { ReactNode } from "react";

import { Modal } from "antd";
import { useState } from "react";

export interface BasicModalProps extends Omit<ModalProps, "confirmLoading" | "onCancel" | "onOk" | "open"> {
	/** Optional element used to open the modal. */
	trigger?: ReactNode
	/** Controlled open state. */
	open?: boolean
	/** Initial open state when the modal is uncontrolled. */
	defaultOpen?: boolean
	/** Called whenever the open state changes. */
	onOpenChange?: (open: boolean) => void
	/** Return `false` to keep the modal open after a successful action. */
	onOk?: () => boolean | void | Promise<boolean | void>
	/** Called after the cancel action. */
	onCancel?: () => void
}

/**
 * Modal with a reusable trigger, controlled/uncontrolled state, and async submit handling.
 */
export function BasicModal({
	trigger,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	onOk,
	onCancel,
	children,
	...modalProps
}: BasicModalProps) {
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const open = controlledOpen ?? internalOpen;

	function setOpen(nextOpen: boolean) {
		if (controlledOpen === undefined) {
			setInternalOpen(nextOpen);
		}
		onOpenChange?.(nextOpen);
	}

	async function handleOk() {
		if (!onOk) {
			setOpen(false);
			return;
		}

		setConfirmLoading(true);
		try {
			const result = await onOk();
			if (result !== false) {
				setOpen(false);
			}
		}
		finally {
			setConfirmLoading(false);
		}
	}

	function handleCancel() {
		onCancel?.();
		setOpen(false);
	}

	return (
		<>
			{trigger && (
				<span className="inline-flex" onClick={() => setOpen(true)}>
					{trigger}
				</span>
			)}
			<Modal
				centered
				destroyOnHidden
				{...modalProps}
				open={open}
				confirmLoading={confirmLoading}
				onCancel={handleCancel}
				onOk={handleOk}
			>
				{children}
			</Modal>
		</>
	);
}
