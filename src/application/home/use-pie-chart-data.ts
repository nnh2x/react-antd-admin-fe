import { useQuery } from "@tanstack/react-query";
import { dashboardRepository } from "#src/infrastructure/home";

export function usePieChartData(by: string | number) {
	return useQuery({
		queryKey: ["dashboard-pie", by],
		queryFn: async () => {
			const responseData = await dashboardRepository.getPieData({ by });
			return responseData.result;
		},
		enabled: Boolean(by),
	});
}
