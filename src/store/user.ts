import type { UserInfoType } from "#src/domain/user";
import { create } from "zustand";

import { userRepository } from "#src/infrastructure/user";

const initialState = {
	id: "",
	avatar: "",
	username: "",
	email: "",
	phoneNumber: "",
	description: "",
	roles: [],
	// menus: [],
};

type UserState = UserInfoType;

interface UserAction {
	getUserInfo: () => Promise<UserInfoType>
	reset: () => void
};

export const useUserStore = create<UserState & UserAction>()(

	set => ({
		...initialState,

		getUserInfo: async () => {
			const response = await userRepository.getUserInfo();
			set({
				...response.result,
			});
			return response.result;
		},

		reset: () => {
			return set({
				...initialState,
			});
		},

	}),

);
