import { menuRepository } from "#src/infrastructure/system/menu";
import { handleTree } from "#src/utils/tree";

/** Used directly as `BasicTable`'s `request` prop. Also returns the flat, untranslated list of menu-type (0) items so the page can build the parent-menu picker — translating display labels stays a presentation concern. */
export async function listMenus(params: any) {
	const responseData = await menuRepository.list(params);
	const menuTree = handleTree(responseData.result.list);
	const parentMenuCandidates = responseData.result.list.filter(item => Number(item.menuType) === 0);
	return {
		...responseData,
		data: menuTree,
		total: responseData.result.total,
		parentMenuCandidates,
	};
}
