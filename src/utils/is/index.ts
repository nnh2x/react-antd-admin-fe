/**
 * Determines whether the given value is of the function type
 *
 * @param value The value to be checked
 * @returns Returns true if the given value is a function type, otherwise returns false
 */
export function isFunction(value: unknown) {
	return typeof value === "function";
}

/**
 * Determines whether the given value is a finite number
 *
 * @param value The value to be checked
 * @returns Returns true if the given value is a finite number, otherwise returns false
 */
export function isNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value);
}

/**
 * Determines whether a value is of the string type
 *
 * @param value The value to be checked
 * @returns Returns a boolean value indicating whether the value is of the string type
 */
export function isString(value: unknown) {
	return typeof value === "string";
}

/**
 * Determines whether the given value is a boolean value
 *
 * @param value The value to be checked
 * @returns Returns true if the given value is a boolean value, otherwise returns false
 */
export function isBoolean(value: unknown) {
	return typeof value === "boolean";
}

/**
 * Determines whether a value is of the object type (excluding null)
 *
 * @param value The value to be checked
 * @returns Returns a boolean value indicating whether the value is of the object type
 */
export function isObject(value: unknown) {
	return typeof value === "object" && value !== null;
}

/**
 * Determines whether a value is null
 *
 * @param value The value to be checked
 * @returns Returns true if the value is null, otherwise returns false
 */
export function isNull(value: unknown) {
	return value === null;
}

/**
 * Determines whether a value is undefined
 *
 * @param value The value to be checked
 * @returns Returns true if the value is undefined, otherwise returns false
 */
export function isUndefined(value: unknown) {
	return value === undefined;
}
