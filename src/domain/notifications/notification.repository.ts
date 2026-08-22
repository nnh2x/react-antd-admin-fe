import type { NotificationItem } from "./notification.entity";

export interface NotificationRepository {
	list: () => Promise<ApiResponse<NotificationItem[]>>
}
