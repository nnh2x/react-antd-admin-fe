import type { ButtonProps } from "antd";

import { useNotifications } from "#src/application/notifications";
import { NotificationPopup } from "./index";

export function NotificationContainer({ ...restProps }: ButtonProps) {
	const { data } = useNotifications();
	const notifications = Array.from({ length: 20 }).flatMap(() => data ?? []);

	return (
		<NotificationPopup
			notifications={notifications}
			{...restProps}
		/>
	);
}
