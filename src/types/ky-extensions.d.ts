import "ky";

/**
 * Extends `ky`'s `Options` type
 * Use `ignoreLoading` to set whether to ignore the loading animation
 */
declare module "ky" {
	interface Options {
		/**
		 * Set whether to ignore the global loading animation
		 */
		ignoreLoading?: boolean
	}
	interface NormalizedOptions {
		/**
		 * Set whether to ignore the global loading animation
		 */
		ignoreLoading?: boolean
	}
}
