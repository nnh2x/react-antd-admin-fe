import { clsx } from "clsx";

interface Props {
	style?: React.CSSProperties
	className?: string
	children: React.ReactNode
}

export function BasicContent(props: Props) {
	const { children, className, style } = props;

	return (
		<div
			id="basic-content"
			/**
			 * 1. When the children's height is too tall and the p-4 style is set, h-full must not be set, to prevent the bottom padding-bottom from disappearing.
			 * See src/pages/about/index.tsx
			 *
			 * 2. If you need the children's height to be less than or equal to basic-content, use h-full
			 * See src/pages/system/role/index.tsx
			 */
			className={clsx("p-4 box-border", className)}
			style={{ ...style }}
		>
			{
				children
			}
		</div>
	);
}
