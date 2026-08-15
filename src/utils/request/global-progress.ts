import { useGlobalStore } from "#src/store/global";

// Defines a global variable used to track how many requests are currently in progress
let requestCount = 0;

export const globalProgress = {
	/**
	 * Start a request
	 *
	 * If the request count is 0, show the global loading animation and increment the request count by 1.
	 */
	start() {
		if (requestCount === 0) {
			// Show the global loading animation
			useGlobalStore.getState().openGlobalSpin();
		}
		// Increment the request count by 1
		requestCount++;
	},

	/**
	 * Callback function invoked after a request completes
	 *
	 * @description Decrements the request count by 1, ensuring it never goes below 0;
	 *              if the request count reaches 0, hides the global loading animation.
	 */
	done() {
		// Decrement the request count by 1, ensuring it never goes below 0
		requestCount = Math.max(requestCount - 1, 0);
		if (requestCount === 0) {
			// Hide the global loading animation
			useGlobalStore.getState().closeGlobalSpin();
		}
	},

	/**
	 * Force-finish all requests
	 *
	 * Sets the request count directly to 0 and hides the global loading animation.
	 */
	forceFinish() {
		// Set the request count directly to 0
		requestCount = 0;
		// Hide the global loading animation
		useGlobalStore.getState().closeGlobalSpin();
	},
};
