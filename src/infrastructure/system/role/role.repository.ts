import type { RoleItemType, RoleRepository } from "#src/domain/system/role";
import { request } from "#src/utils/request";

export const roleRepository: RoleRepository = {
	list: data => request.get<ApiListResponse<RoleItemType>>("role-list", { searchParams: data, ignoreLoading: true }).json(),
	create: data => request.post<ApiResponse<string>>("role-item", { json: data, ignoreLoading: true }).json(),
	update: data => request.put<ApiResponse<string>>("role-item", { json: data, ignoreLoading: true }).json(),
	remove: id => request.delete<ApiResponse<string>>("role-item", { json: id, ignoreLoading: true }).json(),
	getMenuTree: () => request.get<ApiResponse<RoleItemType[]>>("role-menu", { ignoreLoading: true }).json(),
	getMenuIdsByRoleId: data => request.get<ApiResponse<string[]>>("menu-by-role-id", { searchParams: data, ignoreLoading: false }).json(),
};
