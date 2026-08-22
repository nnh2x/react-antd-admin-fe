import { roleRepository } from "#src/infrastructure/system/role";

/** Used directly as `BasicTable`'s `request` prop — ProTable drives its own fetch lifecycle, so this is a plain function rather than a react-query hook. */
export async function listRoles(params: any) {
	const responseData = await roleRepository.list(params);
	return {
		...responseData,
		data: responseData.result.list,
		total: responseData.result.total,
	};
}
