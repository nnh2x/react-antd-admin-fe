import type { ButtonProps } from "antd";
import type { RefObject } from "react";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useFullscreen } from "ahooks";

import { BasicButton } from "#src/components/basic-button";

export interface FullscreenButtonProps extends Omit<ButtonProps, "target"> {
	target: HTMLElement | (() => Element) | RefObject<Element>
	fullscreenIcon?: React.ReactNode
	fullscreenExitIcon?: React.ReactNode
}

/**
 * Fullscreen button component
 *
 * @param target The target element for fullscreen
 * @param fullscreenIcon Icon shown when in fullscreen mode
 * @param fullscreenExitIcon Icon shown when exiting fullscreen mode
 * @param restProps Other properties
 * @returns The fullscreen button component
 */
export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
	target,
	fullscreenIcon,
	fullscreenExitIcon,
	...restProps
}) => {
	const [isFullscreen, { toggleFullscreen }] = useFullscreen(target);

	return (
		<BasicButton
			type="text"
			{...restProps}
			icon={!isFullscreen ? (fullscreenIcon ?? <FullscreenOutlined />) : (fullscreenExitIcon ?? <FullscreenExitOutlined />)}
			onClick={toggleFullscreen}
		/>
	);
};
