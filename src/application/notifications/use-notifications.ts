import { useQuery } from "@tanstack/react-query";
import { notificationRepository } from "#src/infrastructure/notifications";

export function useNotifications() {
	return useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const responseData = await notificationRepository.list();
			return responseData.result;
		},
	});
}
