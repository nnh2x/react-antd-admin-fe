import type { AuthType, RefreshTokenResult, UserInfoType, UserRepository } from "#src/domain/user";
import type { AppRouteRecordRaw } from "#src/router/types";
import { request } from "#src/utils/request";
import { REFRESH_TOKEN_PATH } from "#src/utils/request/constants";

function mockResponse<T>(result: T, delay: number): Promise<ApiResponse<T>> {
	return new Promise(resolve => setTimeout(resolve, delay, { code: 0, success: true, message: "", result }));
}

export const userRepository: UserRepository = {
	login: data => request.post<ApiResponse<AuthType>>("login", { json: data }).json(),
	logout: () => request.post("logout").json(),
	getAsyncRoutes: () => request.get<ApiResponse<AppRouteRecordRaw[]>>("get-async-routes").json(),
	getUserInfo: () => request.get<ApiResponse<UserInfoType>>("user-info").json(),
	refreshToken: data => request.post<ApiResponse<RefreshTokenResult>>(REFRESH_TOKEN_PATH, { json: data }).json(),

	// TODO: replace mock with real endpoint once backend is ready
	sendLoginCode: () => mockResponse(null, 1000),
	forgotPassword: () => mockResponse(null, 1000),
	register: () => mockResponse(null, 500),
	updateProfile: () => mockResponse(null, 500),
};
