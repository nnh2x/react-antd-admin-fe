import { useMutation } from "@tanstack/react-query";
import { menuRepository } from "#src/infrastructure/system/menu";

export function useCreateMenu() {
	return useMutation({ mutationFn: menuRepository.create });
}

export function useUpdateMenu() {
	return useMutation({ mutationFn: menuRepository.update });
}

export function useDeleteMenu() {
	return useMutation({ mutationFn: menuRepository.remove });
}
