import type { MenuItemType, MenuRepository } from "#src/domain/system/menu";
import { request } from "#src/utils/request";

export const menuRepository: MenuRepository = {
	list: data => request.get<ApiListResponse<MenuItemType>>("menu-list", { searchParams: data, ignoreLoading: true }).json(),
	create: data => request.post<ApiResponse<string>>("menu-item", { json: data, ignoreLoading: true }).json(),
	update: data => request.put<ApiResponse<string>>("menu-item", { json: data, ignoreLoading: true }).json(),
	remove: id => request.delete<ApiResponse<string>>("menu-item", { json: id, ignoreLoading: true }).json(),
};
