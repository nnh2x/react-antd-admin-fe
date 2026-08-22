import type { DashboardRepository, PieDataType } from "#src/domain/home";
import { request } from "#src/utils/request";

export const dashboardRepository: DashboardRepository = {
	getLineData: data => request.post<ApiResponse<string[]>>("home/line", { json: data }).json(),
	getPieData: data => request.get<ApiResponse<PieDataType[]>>("home/pie", { searchParams: data }).json(),
};
