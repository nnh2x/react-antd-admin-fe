import type { AuthType, LoginInfo } from "#src/api/user/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchLogin, fetchLogout } from "#src/api/user";
import { useAccessStore } from "#src/store/access";
import { useTabsStore } from "#src/store/tabs";

import { useUserStore } from "#src/store/user";
import { getAppNamespace } from "#src/utils/get-app-namespace";

const initialState = {
	token: "",
	refreshToken: "",
};

type AuthState = AuthType;

interface AuthAction {
	login: (loginPayload: LoginInfo) => Promise<void>
	logout: () => Promise<void>
	reset: () => void
};

export const useAuthStore = create<AuthState & AuthAction>()(

	persist((set, get) => ({
		...initialState,

		login: async (loginPayload) => {
			const response = await fetchLogin(loginPayload);
			set({
				...response.result,
			});
		},

		logout: async () => {
			/**
			 * 1. Log out
			 */

			await fetchLogout();
			/**
			 * 2. Clear token and other information
			 */

			get().reset();
		},

		reset: () => {
			/**
			 * Clear token
			 */
			set({
				...initialState,
			});
			/**
			 * Clear user information
			 * @see {@link https://github.com/pmndrs/zustand?tab=readme-ov-file#read-from-state-in-actions | Read from state in actions}
			 */
			useUserStore.getState().reset();

			/**
			 * Clear access permission information
			 * @see https://github.com/pmndrs/zustand?tab=readme-ov-file#readingwriting-state-and-reacting-to-changes-outside-of-components
			 */
			useAccessStore.getState().reset();

			/**
			 * Clear tabs
			 */
			useTabsStore.getState().resetTabs();

			/**
			 * Clear keepAlive cache
			 * The container-layout component automatically refreshes the keepAlive cache based on openTabs
			 */
		},

	}), { name: getAppNamespace("access-token") }),

);
