import type { MenuItemType } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* Get the menu list */
export function fetchMenuList(data: any) {
	return request.get<ApiListResponse<MenuItemType>>("menu-list", { searchParams: data, ignoreLoading: true }).json();
}

/* Add a menu item */
export function fetchAddMenuItem(data: MenuItemType) {
	return request.post<ApiResponse<string>>("menu-item", { json: data, ignoreLoading: true }).json();
}

/* Update a menu item */
export function fetchUpdateMenuItem(data: MenuItemType) {
	return request.put<ApiResponse<string>>("menu-item", { json: data, ignoreLoading: true }).json();
}

/* Delete a menu item */
export function fetchDeleteMenuItem(id: number) {
	return request.delete<ApiResponse<string>>("menu-item", { json: id, ignoreLoading: true }).json();
}
