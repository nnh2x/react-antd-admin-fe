/**
 * API response data format
 * data: the API response data
 */
interface ApiResponse<T> {
	code: number
	result: T
	message: string
	success: boolean
}

/**
 * API response data format in array form
 * list: the API response data
 */
interface ApiListResponse<T> extends ApiResponse<T> {
	result: {
		list: T[]
		total: number
		current: number
	}
}

/**
 * Request parameters for fetching table data
 */
interface ApiTableRequest extends Record<string, any> {
	cqs?: string
	pageSize?: number
	current?: number
}

type Recordable<T = any> = Record<string, T>;
