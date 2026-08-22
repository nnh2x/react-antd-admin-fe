import type { PieDataType } from "./dashboard.entity";

export interface DashboardRepository {
	getLineData: (params: { range: string }) => Promise<ApiResponse<string[]>>
	getPieData: (params: { by: string | number }) => Promise<ApiResponse<PieDataType[]>>
}
