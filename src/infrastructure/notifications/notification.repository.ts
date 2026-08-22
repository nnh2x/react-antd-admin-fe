import type { NotificationItem, NotificationRepository } from "#src/domain/notifications";
import { request } from "#src/utils/request";

export const notificationRepository: NotificationRepository = {
	list: () => request.get<ApiResponse<NotificationItem[]>>("notifications").json(),
};
