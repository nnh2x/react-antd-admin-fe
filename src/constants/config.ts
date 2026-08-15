import type { TFunction } from "i18next";

/**
 * @description: Configuration items
 */
export const TOKEN = "admin_token"; // token name
export const LANG = "lang"; // language
export const EMPTY_VALUE = "-"; // display for empty value

// Default values for common components
export const MAX_TAG_COUNT = "responsive"; // maximum number of tags to show, responsive: adapts automatically

// Date formatting
export const DATE_FORMAT = "YYYY-MM-DD";
export const TIME_FORMAT = "YYYY-MM-DD hh:mm:ss";

// Initial pagination data
export const INITIAL_PAGINATION = {
	current: 1,
	pageSize: 20,
};

// Add/edit title
export const ADD_TITLE = (t: TFunction, title?: string) => t("public.createTitle", { title: title ?? "" });
export const EDIT_TITLE = (t: TFunction, name: string, title?: string) => `${t("public.editTitle", { title: title ?? "" })}${name ? `(${name})` : ""}`;
