import type { RoleItemType } from "./role.entity";

export interface RoleRepository {
	list: (params: any) => Promise<ApiListResponse<RoleItemType>>
	create: (data: RoleItemType) => Promise<ApiResponse<string>>
	update: (data: RoleItemType) => Promise<ApiResponse<string>>
	remove: (id: number) => Promise<ApiResponse<string>>
	/** Full menu tree, used to render the assignable-menu tree in the role form. */
	getMenuTree: () => Promise<ApiResponse<RoleItemType[]>>
	/** Menu ids currently assigned to a role, used to pre-check the tree when editing. */
	getMenuIdsByRoleId: (params: { id: number }) => Promise<ApiResponse<string[]>>
}
