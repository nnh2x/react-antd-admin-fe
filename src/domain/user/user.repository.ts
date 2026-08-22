import type { AppRouteRecordRaw } from "#src/router/types";
import type { AuthType, LoginInfo, RefreshTokenResult, UserInfoType } from "./user.entity";

export interface UserRepository {
	login: (data: LoginInfo) => Promise<ApiResponse<AuthType>>
	logout: () => Promise<unknown>
	getAsyncRoutes: () => Promise<ApiResponse<AppRouteRecordRaw[]>>
	getUserInfo: () => Promise<ApiResponse<UserInfoType>>
	refreshToken: (data: { readonly refreshToken: string }) => Promise<ApiResponse<RefreshTokenResult>>

	// No backend endpoint yet — see the infrastructure implementation for the mock. The
	// interface stays identical to the real methods above so swapping in a real endpoint
	// later is a one-file change.
	sendLoginCode: (data: { phoneNumber: string }) => Promise<ApiResponse<null>>
	forgotPassword: (data: { email: string }) => Promise<ApiResponse<null>>
	register: (data: { username: string, password: string }) => Promise<ApiResponse<null>>
	updateProfile: (data: Partial<UserInfoType>) => Promise<ApiResponse<null>>
}
