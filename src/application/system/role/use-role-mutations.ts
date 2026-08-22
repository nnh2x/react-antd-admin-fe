import { useMutation } from "@tanstack/react-query";
import { roleRepository } from "#src/infrastructure/system/role";

export function useCreateRole() {
	return useMutation({ mutationFn: roleRepository.create });
}

export function useUpdateRole() {
	return useMutation({ mutationFn: roleRepository.update });
}

export function useDeleteRole() {
	return useMutation({ mutationFn: roleRepository.remove });
}
