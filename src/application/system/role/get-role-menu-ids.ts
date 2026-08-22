import { roleRepository } from "#src/infrastructure/system/role";

/** Menu ids assigned to a role, fetched on-demand when opening the edit drawer. */
export async function getRoleMenuIds(id: number) {
	return roleRepository.getMenuIdsByRoleId({ id });
}
