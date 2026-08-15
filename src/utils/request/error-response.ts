import { isObject } from "#src/utils/is";
import { message } from "#src/utils/static-antd";

/**
 * Handle an error response
 *
 * @param response The response object
 * @returns The response object
 */
export async function handleErrorResponse(response: Response) {
	try {
		// Parse the response body as JSON
		const data = await response.json();

		// Check whether the parsed data is an object
		if (isObject(data)) {
			// Cast the parsed data to an object type containing error information
			const json = data as { errorMsg?: string, message?: string };

			// If the parsed data contains an errorMsg or message property, show it as the error message
			// otherwise show the response's status text as the error message
			message.error(json.errorMsg || json.message || response.statusText);
		}
		else {
			// If the parsed data is not an object, show the response's status text as the error message directly
			message.error(response.statusText);
		}
	}
	catch (e) {
		// If parsing the JSON fails, log the error to the console
		console.error("Error parsing JSON:", e);

		// Show the response's status text as the error message
		message.error(response.statusText);
	}

	// Return the response object
	return response;
}
