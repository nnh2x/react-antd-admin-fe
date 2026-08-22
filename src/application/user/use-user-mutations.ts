import { useMutation } from "@tanstack/react-query";
import { userRepository } from "#src/infrastructure/user";

/** Mock-backed today — see `src/infrastructure/user/user.repository.ts`. */
export function useSendLoginCode() {
	return useMutation({ mutationFn: userRepository.sendLoginCode });
}

/** Mock-backed today — see `src/infrastructure/user/user.repository.ts`. */
export function useForgotPassword() {
	return useMutation({ mutationFn: userRepository.forgotPassword });
}

/** Mock-backed today — see `src/infrastructure/user/user.repository.ts`. */
export function useRegister() {
	return useMutation({ mutationFn: userRepository.register });
}

/** Mock-backed today — see `src/infrastructure/user/user.repository.ts`. */
export function useUpdateProfile() {
	return useMutation({ mutationFn: userRepository.updateProfile });
}
