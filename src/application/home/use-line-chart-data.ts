import { useQuery } from "@tanstack/react-query";
import { dashboardRepository } from "#src/infrastructure/home";

export function useLineChartData(range: string) {
	return useQuery({
		queryKey: ["dashboard-line", range],
		queryFn: async () => {
			const responseData = await dashboardRepository.getLineData({ range });
			return responseData.result;
		},
		enabled: Boolean(range),
	});
}
