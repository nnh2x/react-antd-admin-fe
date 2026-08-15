/**
 * Generic language module mapping type, representing a possibly nested object structure.
 */
interface LanguageModule<T> {
	[key: string]: T | any
}

/**
 * Parameter type for language files, describing the collection of imported language files.
 */
type LanguageFileMap = Record<string, LanguageModule<LanguageFileMap>>;

export function getViVnLang() {
	const langFiles = import.meta.glob<LanguageFileMap>("./vi-VN/**/*.json", {
		import: "default",
		eager: true,
	});
	const result = organizeLanguageFiles(langFiles);
	return result;
}

export function getEnUsLang() {
	const langFiles = import.meta.glob<LanguageFileMap>("./en-US/**/*.json", {
		import: "default",
		eager: true,
	});
	const result = organizeLanguageFiles(langFiles);
	return result;
}

export function organizeLanguageFiles(files: LanguageFileMap) {
	const result: LanguageModule<LanguageFileMap> = {};

	for (const key in files) {
		const data = files[key];
		const fileArr = key?.split("/");
		const fileName = fileArr[fileArr?.length - 1];
		if (!fileName)
			continue;
		const name = fileName.split(".json")[0];
		if (name)
			result[name] = data;
	}

	return result;
}
