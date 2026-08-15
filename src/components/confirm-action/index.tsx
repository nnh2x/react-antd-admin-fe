import type { ButtonProps, PopconfirmProps } from "antd";
import type { ReactNode } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import { useState } from "react";

export interface ConfirmActionProps {
	onConfirm: () => void | Promise<void>
	title?: ReactNode
	description?: ReactNode
	children?: ReactNode
	buttonProps?: ButtonProps
	popconfirmProps?: Omit<PopconfirmProps, "children" | "description" | "onConfirm" | "title">
}

/** Confirmed action with built-in async loading and duplicate-submit protection. */
export function ConfirmAction({
	onConfirm,
	title = "Confirm action",
	description = "This action cannot be undone.",
	children = "Delete",
	buttonProps,
	popconfirmProps,
}: ConfirmActionProps) {
	const [loading, setLoading] = useState(false);

	async function handleConfirm() {
		setLoading(true);
		try {
			await onConfirm();
		}
		finally {
			setLoading(false);
		}
	}

	return (
		<Popconfirm
			title={title}
			description={description}
			okButtonProps={{ danger: true, loading }}
			onConfirm={handleConfirm}
			{...popconfirmProps}
		>
			<Button danger icon={<DeleteOutlined />} loading={loading} {...buttonProps}>
				{children}
			</Button>
		</Popconfirm>
	);
}
