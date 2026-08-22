import { useQuery } from "@tanstack/react-query";
import { roleRepository } from "#src/infrastructure/system/role";

/** Menu tree used to render the assignable-menu checkboxes in the role form. */
export function useRoleMenuTree() {
	return useQuery({
		queryKey: ["role-menu"],
		queryFn: async () => {
			const responseData = await roleRepository.getMenuTree();
			return responseData?.result.map(item => ({
				...item,
				title: item.name,
				key: item.id,
			}));
		},
		initialData: [],
	});
}
