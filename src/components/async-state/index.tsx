import type { ReactNode } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, Result, Skeleton } from "antd";

export interface AsyncStateProps {
	loading?: boolean
	error?: unknown
	isEmpty?: boolean
	onRetry?: () => void
	emptyTitle?: ReactNode
	emptyDescription?: ReactNode
	loadingRows?: number
	children: ReactNode
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error)
		return error.message;
	return "An unexpected error occurred. Please try again.";
}

/** Standard loading, error, empty, and success states for page sections. */
export function AsyncState({
	loading,
	error,
	isEmpty,
	onRetry,
	emptyTitle = "No data",
	emptyDescription,
	loadingRows = 4,
	children,
}: AsyncStateProps) {
	if (loading)
		return <Skeleton active paragraph={{ rows: loadingRows }} />;

	if (error) {
		return (
			<Result
				status="error"
				title="Unable to load data"
				subTitle={getErrorMessage(error)}
				extra={onRetry && <Button icon={<ReloadOutlined />} onClick={onRetry}>Try again</Button>}
			/>
		);
	}

	if (isEmpty) {
		return (
			<Empty description={(
				<div>
					<div>{emptyTitle}</div>
					{emptyDescription && <div className="mt-1 text-xs opacity-70">{emptyDescription}</div>}
				</div>
			)}
			/>
		);
	}

	return children;
}
