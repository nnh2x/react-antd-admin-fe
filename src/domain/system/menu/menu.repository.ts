import type { MenuItemType } from "./menu.entity";

export interface MenuRepository {
	list: (params: any) => Promise<ApiListResponse<MenuItemType>>
	create: (data: MenuItemType) => Promise<ApiResponse<string>>
	update: (data: MenuItemType) => Promise<ApiResponse<string>>
	remove: (id: number) => Promise<ApiResponse<string>>
}
