import type { ReactNode } from "react";
import { Spin } from "antd";
import { createUseStyles } from "react-jss";

import { useSpinDelay } from "spin-delay";
import { useGlobalStore } from "#src/store/global";

import { usePreferencesStore } from "#src/store/preferences";
import { cn } from "#src/utils/cn";

export interface GlobalSpinProps {
	className?: string
	children: ReactNode
}

const useStyles = createUseStyles({
	rootSpin: {
		"height": "100%",
		"& .ant-spin-container": {
			height: "100%",
		},
		"& .ant-spin-spinning": {
			maxHeight: "100% !important",
		},
	},
});

export function GlobalSpin({ children, className }: GlobalSpinProps) {
	const classes = useStyles();
	const spinning = useGlobalStore(state => state.globalSpin);
	/**
	 * If the API response comes back too quickly, the page may flicker, so use useSpinDelay to optimize Spin
	 *
	 * @see https://github.com/ant-design/ant-design/issues/51828
	 */
	const loading = useSpinDelay(spinning, { delay: 500, minDuration: 200 });
	const transitionLoading = usePreferencesStore(state => state.transitionLoading);

	if (!transitionLoading) {
		return children;
	};

	return (
		<Spin
			delay={300}
			spinning={loading}
			classNames={{
				root: cn(classes.rootSpin, className),
			}}
		>
			{children}
		</Spin>
	);
}
