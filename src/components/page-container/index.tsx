import type { ReactNode } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import { useNavigate } from "react-router";
import { BasicContent } from "#src/components/basic-content";
import { cn } from "#src/utils/cn";

export interface PageContainerProps {
	title: ReactNode
	description?: ReactNode
	extra?: ReactNode
	children: ReactNode
	back?: boolean | (() => void)
	card?: boolean
	className?: string
	contentClassName?: string
}

/** Consistent page heading, actions, spacing, and optional content card. */
export function PageContainer({
	title,
	description,
	extra,
	children,
	back = false,
	card = true,
	className,
	contentClassName,
}: PageContainerProps) {
	const navigate = useNavigate();
	const content = card ? <Card className={contentClassName}>{children}</Card> : children;

	return (
		<BasicContent className={cn("mx-auto w-full max-w-[1600px]", className)}>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-2">
					{back && (
						<Button
							type="text"
							aria-label="Go back"
							icon={<ArrowLeftOutlined />}
							onClick={() => typeof back === "function" ? back() : navigate(-1)}
						/>
					)}
					<div className="min-w-0">
						<Typography.Title level={3} className="!mb-0">{title}</Typography.Title>
						{description && <Typography.Text type="secondary">{description}</Typography.Text>}
					</div>
				</div>
				{extra && <Space wrap>{extra}</Space>}
			</div>
			{content}
		</BasicContent>
	);
}
