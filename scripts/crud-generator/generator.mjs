import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SUPPORTED_FIELD_TYPES = new Set(["text", "textarea", "number", "select", "boolean", "date", "datetime"]);
const IDENTIFIER_PATTERN = /^[a-z_$][\w$]*$/i;
const PATH_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ICON_PATTERN = /^[A-Z][A-Za-z0-9]*Outlined$/;
const DEFAULT_MENU_ICON = "AppstoreOutlined";

function quote(value) {
	return JSON.stringify(value);
}

function indent(value, level = 1) {
	const prefix = "\t".repeat(level);
	return value.split("\n").map(line => line ? `${prefix}${line}` : line).join("\n");
}

function toPascalCase(value) {
	return value
		.split("-")
		.filter(Boolean)
		.map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join("");
}

function toCamelCase(value) {
	const pascal = toPascalCase(value);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toTitleCase(value) {
	return value
		.split("-")
		.filter(Boolean)
		.map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function ensurePathSegment(value, property) {
	if (typeof value !== "string" || !PATH_SEGMENT_PATTERN.test(value)) {
		throw new Error(`${property} phải ở dạng kebab-case và không được chứa đường dẫn cha.`);
	}
}

function ensureIdentifier(value, property) {
	if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
		throw new Error(`${property} phải là một JavaScript identifier hợp lệ.`);
	}
}

function normalizeEndpoint(endpoint) {
	if (typeof endpoint !== "string" || !endpoint.trim()) {
		throw new Error("endpoint không được để trống.");
	}
	if (/^[a-z][a-z\d+.-]*:\/\//i.test(endpoint)) {
		throw new Error("endpoint phải là đường dẫn tương đối vì request client đã cấu hình API prefix.");
	}
	return endpoint.trim().replace(/^\/+|\/+$/g, "");
}

function normalizeOption(option, fieldName) {
	if (!option || typeof option !== "object" || typeof option.label !== "string") {
		throw new Error(`Option của field ${fieldName} phải có label và value.`);
	}
	if (!["string", "number"].includes(typeof option.value)) {
		throw new Error(`Value của option trong field ${fieldName} chỉ hỗ trợ string hoặc number.`);
	}
	return {
		label: option.label,
		labelEn: typeof option.labelEn === "string" && option.labelEn.trim() ? option.labelEn.trim() : option.label,
		value: option.value,
	};
}

function normalizeField(field, index) {
	if (!field || typeof field !== "object") {
		throw new Error(`fields[${index}] không hợp lệ.`);
	}
	ensureIdentifier(field.name, `fields[${index}].name`);
	const type = field.type ?? "text";
	if (!SUPPORTED_FIELD_TYPES.has(type)) {
		throw new Error(`Field ${field.name} có type không hỗ trợ: ${type}.`);
	}
	const label = typeof field.label === "string" && field.label.trim() ? field.label.trim() : field.name;
	const normalized = {
		name: field.name,
		label,
		labelEn: typeof field.labelEn === "string" && field.labelEn.trim() ? field.labelEn.trim() : label,
		type,
		required: field.required === true,
		table: field.table !== false,
		search: field.search === true,
		form: field.form !== false,
		detail: field.detail !== false,
		initialValue: field.initialValue,
	};

	if (type === "select") {
		if (!Array.isArray(field.options) || field.options.length === 0) {
			throw new Error(`Field select ${field.name} phải có ít nhất một option.`);
		}
		normalized.options = field.options.map(option => normalizeOption(option, field.name));
	}
	return normalized;
}

export function normalizeConfig(rawConfig) {
	if (!rawConfig || typeof rawConfig !== "object") {
		throw new Error("Config phải là một JSON object.");
	}
	const name = rawConfig.name;
	const moduleName = rawConfig.module;
	ensurePathSegment(name, "name");
	ensurePathSegment(moduleName, "module");
	ensureIdentifier(rawConfig.idField ?? "id", "idField");

	if (!Array.isArray(rawConfig.fields) || rawConfig.fields.length === 0) {
		throw new Error("fields phải có ít nhất một field.");
	}
	const fields = rawConfig.fields.map(normalizeField);
	const duplicateField = fields.find((field, index) => fields.findIndex(item => item.name === field.name) !== index);
	if (duplicateField) {
		throw new Error(`Field ${duplicateField.name} bị khai báo trùng.`);
	}
	if (fields.some(field => field.name === (rawConfig.idField ?? "id"))) {
		throw new Error("Không khai báo khóa chính trong fields; hãy dùng idField và idType.");
	}
	if (!fields.some(field => field.table)) {
		throw new Error("Cần ít nhất một field hiển thị trên bảng.");
	}
	if (!fields.some(field => field.form)) {
		throw new Error("Cần ít nhất một field hiển thị trong form.");
	}

	const idType = rawConfig.idType ?? "number";
	if (!["string", "number"].includes(idType)) {
		throw new Error("idType chỉ nhận string hoặc number.");
	}

	const menuIcon = typeof rawConfig.menuIcon === "string" && rawConfig.menuIcon.trim() ? rawConfig.menuIcon.trim() : DEFAULT_MENU_ICON;
	if (!ICON_PATTERN.test(menuIcon)) {
		throw new Error("menuIcon phải là tên Ant Design icon hợp lệ, ví dụ AppstoreOutlined.");
	}

	const title = typeof rawConfig.title === "string" && rawConfig.title.trim() ? rawConfig.title.trim() : toPascalCase(name);
	const isGroup = moduleName !== name;
	const groupTitle = typeof rawConfig.groupTitle === "string" && rawConfig.groupTitle.trim() ? rawConfig.groupTitle.trim() : toTitleCase(moduleName);

	return {
		name,
		module: moduleName,
		isGroup,
		title,
		titleEn: typeof rawConfig.titleEn === "string" && rawConfig.titleEn.trim() ? rawConfig.titleEn.trim() : title,
		groupTitle,
		groupTitleEn: typeof rawConfig.groupTitleEn === "string" && rawConfig.groupTitleEn.trim() ? rawConfig.groupTitleEn.trim() : groupTitle,
		menuIcon,
		endpoint: normalizeEndpoint(rawConfig.endpoint ?? `${name}s`),
		idField: rawConfig.idField ?? "id",
		idType,
		idLabel: typeof rawConfig.idLabel === "string" && rawConfig.idLabel.trim() ? rawConfig.idLabel.trim() : "ID",
		fields,
	};
}

function typeForField(field) {
	if (field.type === "number")
		return "number";
	if (field.type === "boolean")
		return "boolean";
	if (field.type === "select") {
		return [...new Set(field.options.map(option => quote(option.value)))].join(" | ");
	}
	return "string";
}

// ---------------------------------------------------------------------------
// Domain layer: entity types + repository interface. See
// .claude/skills/clean-architecture/SKILL.md for the layering this generator
// targets — domain has no dependency on infrastructure/application/presentation.
// ---------------------------------------------------------------------------

function renderEntity(config) {
	const pascalName = toPascalCase(config.name);
	const itemFields = [
		`${config.idField}: ${config.idType}`,
		...config.fields.map(field => `${field.name}${field.required ? "" : "?"}: ${typeForField(field)}`),
	];
	const formFieldNames = config.fields.filter(field => field.form).map(field => quote(field.name)).join(" | ");

	return `export interface ${pascalName}Item {\n${indent(itemFields.join("\n"))}\n}\n\nexport type Create${pascalName}Input = Pick<${pascalName}Item, ${formFieldNames}>;\n\nexport type Update${pascalName}Input = Create${pascalName}Input & Pick<${pascalName}Item, ${quote(config.idField)}>;\n\nexport interface ${pascalName}Query extends ApiTableRequest {\n${indent(config.fields.filter(field => field.search).map(field => `${field.name}?: ${typeForField(field)}`).join("\n"))}\n}\n`;
}

function renderRepositoryInterface(config) {
	const pascalName = toPascalCase(config.name);
	return `import type { Create${pascalName}Input, Update${pascalName}Input, ${pascalName}Item, ${pascalName}Query } from "./${config.name}.entity";\n\nexport interface ${pascalName}Repository {\n\tlist: (params: ${pascalName}Query) => Promise<ApiListResponse<${pascalName}Item>>\n\tdetail: (id: ${pascalName}Item[${quote(config.idField)}]) => Promise<ApiResponse<${pascalName}Item>>\n\tcreate: (data: Create${pascalName}Input) => Promise<ApiResponse<${pascalName}Item>>\n\tupdate: (data: Update${pascalName}Input) => Promise<ApiResponse<${pascalName}Item>>\n\tremove: (id: ${pascalName}Item[${quote(config.idField)}]) => Promise<ApiResponse<${pascalName}Item[${quote(config.idField)}]>>\n}\n`;
}

function renderDomainIndex(config) {
	return `export * from "./${config.name}.entity";\nexport type * from "./${config.name}.repository";\n`;
}

// ---------------------------------------------------------------------------
// Infrastructure layer: the one repository implementation, using the shared
// `request` (ky) client — this is what used to be `src/api/**`.
// ---------------------------------------------------------------------------

function renderRepositoryImpl(config) {
	const pascalName = toPascalCase(config.name);
	const camelName = toCamelCase(config.name);
	return `import type { Create${pascalName}Input, Update${pascalName}Input, ${pascalName}Item, ${pascalName}Repository } from "#src/domain/${config.module}/${config.name}";\nimport { request } from "#src/utils/request";\n\nconst RESOURCE_URL = ${quote(config.endpoint)};\nconst resourceUrl = (id: ${pascalName}Item[${quote(config.idField)}]) => [RESOURCE_URL, encodeURIComponent(String(id))].join("/");\n\nexport const ${camelName}Repository: ${pascalName}Repository = {\n\tlist: data => request.get<ApiListResponse<${pascalName}Item>>(RESOURCE_URL, { searchParams: data, ignoreLoading: true }).json(),\n\tdetail: id => request.get<ApiResponse<${pascalName}Item>>(resourceUrl(id)).json(),\n\tcreate: (data: Create${pascalName}Input) => request.post<ApiResponse<${pascalName}Item>>(RESOURCE_URL, { json: data }).json(),\n\tupdate: (data: Update${pascalName}Input) => request.put<ApiResponse<${pascalName}Item>>(resourceUrl(data.${config.idField}), { json: data }).json(),\n\tremove: id => request.delete<ApiResponse<${pascalName}Item[${quote(config.idField)}]>>(resourceUrl(id)).json(),\n};\n`;
}

function renderInfrastructureIndex(config) {
	return `export * from "./${config.name}.repository";\n`;
}

// ---------------------------------------------------------------------------
// Application layer: the use-cases presentation is allowed to call. Owns all
// useQuery/useMutation composition — pages/components never call the
// repository directly.
// ---------------------------------------------------------------------------

function renderApplicationList(config) {
	const pascalName = toPascalCase(config.name);
	const camelName = toCamelCase(config.name);
	return `import type { ${pascalName}Query } from "#src/domain/${config.module}/${config.name}";\nimport { ${camelName}Repository } from "#src/infrastructure/${config.module}/${config.name}";\n\n/** Used directly as \`BasicTable\`'s \`request\` prop. */\nexport async function list${pascalName}s(params: ${pascalName}Query) {\n\tconst responseData = await ${camelName}Repository.list(params);\n\treturn {\n\t\t...responseData,\n\t\tdata: responseData.result.list,\n\t\ttotal: responseData.result.total,\n\t};\n}\n`;
}

function renderApplicationDetail(config) {
	const pascalName = toPascalCase(config.name);
	const camelName = toCamelCase(config.name);
	return `import type { ${pascalName}Item } from "#src/domain/${config.module}/${config.name}";\nimport { ${camelName}Repository } from "#src/infrastructure/${config.module}/${config.name}";\n\nexport async function get${pascalName}Detail(id: ${pascalName}Item[${quote(config.idField)}]) {\n\treturn ${camelName}Repository.detail(id);\n}\n`;
}

function renderApplicationMutations(config) {
	const pascalName = toPascalCase(config.name);
	const camelName = toCamelCase(config.name);
	return `import { useMutation } from "@tanstack/react-query";\nimport { ${camelName}Repository } from "#src/infrastructure/${config.module}/${config.name}";\n\nexport function useCreate${pascalName}() {\n\treturn useMutation({ mutationFn: ${camelName}Repository.create });\n}\n\nexport function useUpdate${pascalName}() {\n\treturn useMutation({ mutationFn: ${camelName}Repository.update });\n}\n\nexport function useDelete${pascalName}() {\n\treturn useMutation({ mutationFn: ${camelName}Repository.remove });\n}\n`;
}

function renderApplicationIndex(config) {
	return `export * from "./get-${config.name}-detail";\nexport * from "./list-${config.name}s";\nexport * from "./use-${config.name}-mutations";\n`;
}

// ---------------------------------------------------------------------------
// Presentation layer: page, table/detail column config, and drawer form.
// Imports only from the application and domain layers above.
// ---------------------------------------------------------------------------

function renderValueEnum(field, config) {
	if (field.type !== "select")
		return "";
	const entries = field.options.map(option => `${quote(option.value)}: { text: t(${quote(`${config.name}.${field.name}Options.${option.value}`)}) },`).join("\n");
	return `\n\tvalueEnum: {\n${indent(entries, 2)}\n\t},`;
}

/**
 * Per-column search box (`BasicTable`'s `headerSearch`), rendered under the column header —
 * distinct from `search`, which controls ProTable's collapsible search form above the table.
 * `select` fields get a `Select` populated from the field's own options (pre-built antd
 * component, same pattern as the hand-written status column in system/role); every other
 * searchable type gets the default debounced `Input` via `headerSearch: true`.
 */
function renderHeaderSearch(field, config) {
	if (!field.search)
		return "";
	if (field.type !== "select")
		return "\n\theaderSearch: true,";
	const options = field.options.map(option => `{ label: t(${quote(`${config.name}.${field.name}Options.${option.value}`)}), value: ${quote(option.value)} },`).join("\n");
	return `\n\theaderSearch: {\n\t\trender: (value, onChange) => (\n\t\t\t<Select\n\t\t\t\tsize="small"\n\t\t\t\tallowClear\n\t\t\t\tvalue={value || undefined}\n\t\t\t\tplaceholder={t("common.search")}\n\t\t\t\tonClick={event => event.stopPropagation()}\n\t\t\t\tonChange={next => onChange(next ?? "")}\n\t\t\t\toptions={[\n${indent(options, 5)}\n\t\t\t\t]}\n\t\t\t/>\n\t\t),\n\t},`;
}

function renderColumn(field, config) {
	return `{\n\ttitle: t(${quote(`${config.name}.table.${field.name}`)}),\n\tdataIndex: ${quote(field.name)},\n\tvalueType: ${quote(valueTypeForField(field))},\n\tsearch: ${field.search},${renderHeaderSearch(field, config)}${renderValueEnum(field, config)}\n}`;
}

function renderDetailColumn(field, config) {
	const title = field.isIdField ? quote(field.label) : `t(${quote(`${config.name}.table.${field.name}`)})`;
	return `{\n\ttitle: ${title},\n\tdataIndex: ${quote(field.name)},\n\tvalueType: ${quote(valueTypeForField(field))},${renderValueEnum(field, config)}\n}`;
}

function valueTypeForField(field) {
	return {
		text: "text",
		textarea: "textarea",
		number: "digit",
		select: "select",
		boolean: "switch",
		date: "date",
		datetime: "dateTime",
	}[field.type];
}

function renderConstants(config) {
	const pascalName = toPascalCase(config.name);
	const tableColumns = config.fields.filter(field => field.table).map(field => renderColumn(field, config));
	const detailFields = [
		{ name: config.idField, label: config.idLabel, type: config.idType === "number" ? "number" : "text", isIdField: true },
		...config.fields.filter(field => field.detail),
	].map(field => renderDetailColumn(field, config));
	const hasSelectHeaderSearch = config.fields.some(field => field.table && field.search && field.type === "select");
	const antdImport = hasSelectHeaderSearch ? "import { Select } from \"antd\";\n" : "";

	return `import type { ProDescriptionsItemProps } from "@ant-design/pro-components";\nimport type { TFunction } from "i18next";\nimport type { BasicTableColumn } from "#src/components/basic-table";\nimport type { ${pascalName}Item } from "#src/domain/${config.module}/${config.name}";\n${antdImport}\nexport function get${pascalName}Columns(t: TFunction): BasicTableColumn<${pascalName}Item>[] {\n\treturn [\n\t\t{\n\t\t\ttitle: t("common.index"),\n\t\t\tvalueType: "indexBorder",\n\t\t\twidth: 72,\n\t\t\tsearch: false,\n\t\t},\n${indent(tableColumns.map(column => `${column},`).join("\n"), 2)}\n\t];\n}\n\nexport function get${pascalName}DetailColumns(t: TFunction): ProDescriptionsItemProps<${pascalName}Item>[] {\n\treturn [\n${indent(detailFields.map(column => `${column},`).join("\n"), 2)}\n\t];\n}\n`;
}

function formComponentForField(field) {
	return {
		text: "ProFormText",
		textarea: "ProFormTextArea",
		number: "ProFormDigit",
		select: "ProFormSelect",
		boolean: "ProFormSwitch",
		date: "ProFormDatePicker",
		datetime: "ProFormDateTimePicker",
	}[field.type];
}

function renderFormField(field, config) {
	const component = formComponentForField(field);
	const options = field.type === "select"
		? `\n\toptions={[\n${indent(field.options.map(option => `{ label: t(${quote(`${config.name}.${field.name}Options.${option.value}`)}), value: ${quote(option.value)} },`).join("\n"), 2)}\n\t]}`
		: "";
	return `<${component}\n\tname=${quote(field.name)}\n\tlabel={t(${quote(`${config.name}.form.${field.name}`)})}\n\trules={[{ required: ${field.required}, message: t(${quote(`${config.name}.form.${field.name}Required`)}) }]}${options}\n/>`;
}

function renderDrawer(config) {
	const pascalName = toPascalCase(config.name);
	const formFields = config.fields.filter(field => field.form);
	const formComponents = [...new Set(formFields.map(formComponentForField))].sort();
	const initialValues = formFields
		.filter(field => field.initialValue !== undefined)
		.map(field => `${field.name}: ${quote(field.initialValue)},`)
		.join("\n");
	const fieldMarkup = formFields.map(field => renderFormField(field, config)).join("\n\n");

	return `import type { Create${pascalName}Input, ${pascalName}Item } from "#src/domain/${config.module}/${config.name}";\nimport {\n\tDrawerForm,\n\tProDescriptions,\n${indent(formComponents.map(component => `${component},`).join("\n"))}\n} from "@ant-design/pro-components";\nimport { Drawer, Form } from "antd";\nimport { useEffect } from "react";\nimport { useTranslation } from "react-i18next";\nimport { useCreate${pascalName}, useUpdate${pascalName} } from "#src/application/${config.module}/${config.name}";\n\nimport { get${pascalName}DetailColumns } from "../constants";\n\nexport type ${pascalName}DrawerMode = "create" | "edit" | "view";\n\ninterface ${pascalName}DrawerProps {\n\tmode: ${pascalName}DrawerMode\n\topen: boolean\n\tdetailData: Partial<${pascalName}Item>\n\tonClose: () => void\n\tonSuccess: () => void\n}\n\nexport function ${pascalName}Drawer({ mode, open, detailData, onClose, onSuccess }: ${pascalName}DrawerProps) {\n\tconst { t } = useTranslation();\n\tconst [form] = Form.useForm<Create${pascalName}Input>();\n\tconst createMutation = useCreate${pascalName}();\n\tconst updateMutation = useUpdate${pascalName}();\n\tconst title = [\n\t\tmode === "create" ? t("common.add") : mode === "edit" ? t("common.update") : t("common.view"),\n\t\tt(${quote(`${config.name}.title`)}),\n\t].join(" ");\n\n\tuseEffect(() => {\n\t\tif (!open || mode === "view")\n\t\t\treturn;\n\t\tform.resetFields();\n\t\tform.setFieldsValue(detailData);\n\t}, [detailData, form, mode, open]);\n\n\tif (mode === "view") {\n\t\treturn (\n\t\t\t<Drawer title={title} open={open} width={640} onClose={onClose} destroyOnHidden>\n\t\t\t\t<ProDescriptions<${pascalName}Item>\n\t\t\t\t\tcolumn={1}\n\t\t\t\t\tcolumns={get${pascalName}DetailColumns(t)}\n\t\t\t\t\tdataSource={detailData as ${pascalName}Item}\n\t\t\t\t/>\n\t\t\t</Drawer>\n\t\t);\n\t}\n\n\tconst onFinish = async (values: Create${pascalName}Input) => {\n\t\tif (mode === "edit") {\n\t\t\tconst recordId = detailData.${config.idField};\n\t\t\tif (recordId === undefined || recordId === null)\n\t\t\t\tthrow new Error("Không tìm thấy khóa chính của bản ghi.");\n\t\t\tawait updateMutation.mutateAsync({ ...values, ${config.idField}: recordId });\n\t\t\twindow.$message?.success(t("common.updateSuccess"));\n\t\t}\n\t\telse {\n\t\t\tawait createMutation.mutateAsync(values);\n\t\t\twindow.$message?.success(t("common.addSuccess"));\n\t\t}\n\t\tonSuccess();\n\t\treturn true;\n\t};\n\n\treturn (\n\t\t<DrawerForm<Create${pascalName}Input>\n\t\t\ttitle={title}\n\t\t\topen={open}\n\t\t\tform={form}\n\t\t\tinitialValues={{\n${indent(initialValues, 4)}\n\t\t\t}}\n\t\t\tdrawerProps={{ destroyOnHidden: true }}\n\t\t\tresize={{ minWidth: 480, maxWidth: window.innerWidth * 0.8 }}\n\t\t\tonOpenChange={visible => !visible && onClose()}\n\t\t\tonFinish={onFinish}\n\t\t>\n${indent(fieldMarkup, 3)}\n\t\t</DrawerForm>\n\t);\n}\n`;
}

function renderPage(config) {
	const pascalName = toPascalCase(config.name);
	return `import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";\nimport type { ${pascalName}Item, ${pascalName}Query } from "#src/domain/${config.module}/${config.name}";\nimport type { ${pascalName}DrawerMode } from "./components/${config.name}-drawer";\n\nimport { PlusCircleOutlined } from "@ant-design/icons";\nimport { Button, Popconfirm } from "antd";\nimport { useRef, useState } from "react";\nimport { useTranslation } from "react-i18next";\nimport { get${pascalName}Detail, list${pascalName}s, useDelete${pascalName} } from "#src/application/${config.module}/${config.name}";\nimport { BasicButton } from "#src/components/basic-button";\nimport { BasicContent } from "#src/components/basic-content";\nimport { BasicTable } from "#src/components/basic-table";\nimport { accessControlCodes, useAccess } from "#src/hooks/use-access";\n\nimport { ${pascalName}Drawer } from "./components/${config.name}-drawer";\nimport { get${pascalName}Columns } from "./constants";\n\nexport default function ${pascalName}Page() {\n\tconst { t } = useTranslation();\n\tconst { hasAccessByCodes } = useAccess();\n\tconst actionRef = useRef<ActionType>(null);\n\tconst [drawerOpen, setDrawerOpen] = useState(false);\n\tconst [drawerMode, setDrawerMode] = useState<${pascalName}DrawerMode>("view");\n\tconst [detailData, setDetailData] = useState<Partial<${pascalName}Item>>({});\n\tconst deleteMutation = useDelete${pascalName}();\n\n\tconst closeDrawer = () => {\n\t\tsetDrawerOpen(false);\n\t\tsetDetailData({});\n\t};\n\n\tconst openDrawer = async (mode: ${pascalName}DrawerMode, record?: ${pascalName}Item) => {\n\t\tsetDrawerMode(mode);\n\t\tif (mode === "create") {\n\t\t\tsetDetailData({});\n\t\t}\n\t\telse if (record) {\n\t\t\tconst response = await get${pascalName}Detail(record.${config.idField});\n\t\t\tsetDetailData(response.result);\n\t\t}\n\t\tsetDrawerOpen(true);\n\t};\n\n\tconst handleDelete = async (record: ${pascalName}Item, action?: ProCoreActionType<object>) => {\n\t\tawait deleteMutation.mutateAsync(record.${config.idField});\n\t\twindow.$message?.success(t("common.deleteSuccess"));\n\t\tawait action?.reload?.();\n\t};\n\n\tconst columns: ProColumns<${pascalName}Item>[] = [\n\t\t...get${pascalName}Columns(t),\n\t\t{\n\t\t\ttitle: t("common.action"),\n\t\t\tvalueType: "option",\n\t\t\tkey: "actions",\n\t\t\tsearch: false,\n\t\t\tfixed: "right",\n\t\t\twidth: 180,\n\t\t\trender: (_, record, __, action) => [\n\t\t\t\t<BasicButton key="view" type="link" size="small" onClick={() => openDrawer("view", record)}>\n\t\t\t\t\t{t("common.view")}\n\t\t\t\t</BasicButton>,\n\t\t\t\t<BasicButton\n\t\t\t\t\tkey="edit"\n\t\t\t\t\ttype="link"\n\t\t\t\t\tsize="small"\n\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.update)}\n\t\t\t\t\tonClick={() => openDrawer("edit", record)}\n\t\t\t\t>\n\t\t\t\t\t{t("common.edit")}\n\t\t\t\t</BasicButton>,\n\t\t\t\t<Popconfirm\n\t\t\t\t\tkey="delete"\n\t\t\t\t\ttitle={t("common.confirmDelete")}\n\t\t\t\t\tokText={t("common.confirm")}\n\t\t\t\t\tcancelText={t("common.cancel")}\n\t\t\t\t\tonConfirm={() => handleDelete(record, action)}\n\t\t\t\t>\n\t\t\t\t\t<BasicButton type="link" size="small" disabled={!hasAccessByCodes(accessControlCodes.delete)}>\n\t\t\t\t\t\t{t("common.delete")}\n\t\t\t\t\t</BasicButton>\n\t\t\t\t</Popconfirm>,\n\t\t\t],\n\t\t},\n\t];\n\n\treturn (\n\t\t<BasicContent className="h-full">\n\t\t\t<BasicTable<${pascalName}Item, ${pascalName}Query>\n\t\t\t\tadaptive\n\t\t\t\tactionRef={actionRef}\n\t\t\t\tcolumns={columns}\n\t\t\t\tcolumnsState={{\n\t\t\t\t\tpersistenceKey: ${quote(`${config.module}-${config.name}-columns`)},\n\t\t\t\t\tpersistenceType: "localStorage",\n\t\t\t\t}}\n\t\t\t\theaderTitle={t(${quote(`${config.name}.title`)})}\n\t\t\t\trequest={list${pascalName}s}\n\t\t\t\ttoolBarRender={() => [\n\t\t\t\t\t<Button\n\t\t\t\t\t\tkey="create"\n\t\t\t\t\t\ttype="primary"\n\t\t\t\t\t\ticon={<PlusCircleOutlined />}\n\t\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.add)}\n\t\t\t\t\t\tonClick={() => openDrawer("create")}\n\t\t\t\t\t>\n\t\t\t\t\t\t{t("common.add")}\n\t\t\t\t\t</Button>,\n\t\t\t\t]}\n\t\t\t/>\n\t\t\t<${pascalName}Drawer\n\t\t\t\tmode={drawerMode}\n\t\t\t\topen={drawerOpen}\n\t\t\t\tdetailData={detailData}\n\t\t\t\tonClose={closeDrawer}\n\t\t\t\tonSuccess={() => {\n\t\t\t\t\tcloseDrawer();\n\t\t\t\t\tactionRef.current?.reload();\n\t\t\t\t}}\n\t\t\t/>\n\t\t</BasicContent>\n\t);\n}\n`;
}

// ---------------------------------------------------------------------------
// Router wiring + i18n: makes the module show up in the menu, in both
// languages, without any manual follow-up step. `src/router/routes/modules/**`
// is glob-loaded automatically (see src/router/routes/index.ts), and
// `src/locales/<lang>/**/*.json` files are glob-loaded as one namespace per
// filename (see src/locales/helper.ts) — so `<name>.json` becomes the `t("<name>.xxx")` namespace used above.
// ---------------------------------------------------------------------------

/** `module === name`: one page, own top-level menu entry — parent path IS the page. */
function renderStandaloneRoute(config) {
	const pascalName = toPascalCase(config.name);

	return `import type { AppRouteRecordRaw } from "#src/router/types";\nimport { lazy } from "react";\nimport ContainerLayout from "#src/layout/container-layout";\n\nimport { $t } from "#src/locales";\n\nconst ${pascalName}Page = lazy(() => import("#src/pages/${config.module}/${config.name}"));\n\nconst routes: AppRouteRecordRaw[] = [\n\t{\n\t\tpath: ${quote(`/${config.name}`)},\n\t\tComponent: ContainerLayout,\n\t\thandle: {\n\t\t\torder: 200,\n\t\t\ttitle: $t(${quote(`${config.name}.title`)}),\n\t\t\ticon: ${quote(config.menuIcon)},\n\t\t},\n\t\tchildren: [\n\t\t\t{\n\t\t\t\tindex: true,\n\t\t\t\tComponent: ${pascalName}Page,\n\t\t\t\thandle: {\n\t\t\t\t\ttitle: $t(${quote(`${config.name}.title`)}),\n\t\t\t\t\tpermissions: [\n\t\t\t\t\t\t"permission:button:add",\n\t\t\t\t\t\t"permission:button:update",\n\t\t\t\t\t\t"permission:button:delete",\n\t\t\t\t\t],\n\t\t\t\t},\n\t\t\t},\n\t\t],\n\t},\n];\n\nexport default routes;\n`;
}

/** One entry inside a group module's `children: [...]` — used by both a fresh group file and an appended sibling. */
function renderChildRouteEntry(config) {
	const pascalName = toPascalCase(config.name);
	return `\t\t\t{\n\t\t\t\tpath: ${quote(`/${config.module}/${config.name}`)},\n\t\t\t\tComponent: ${pascalName}Page,\n\t\t\t\thandle: {\n\t\t\t\t\ttitle: $t(${quote(`${config.name}.title`)}),\n\t\t\t\t\tpermissions: [\n\t\t\t\t\t\t"permission:button:add",\n\t\t\t\t\t\t"permission:button:update",\n\t\t\t\t\t\t"permission:button:delete",\n\t\t\t\t\t],\n\t\t\t\t},\n\t\t\t},`;
}

/** `module !== name`, first page in this module: a fresh group file, one shared parent menu entry, this page as its first child. */
function renderRouteGroup(config) {
	const pascalName = toPascalCase(config.name);
	return `import type { AppRouteRecordRaw } from "#src/router/types";\nimport { lazy } from "react";\nimport ContainerLayout from "#src/layout/container-layout";\n\nimport { $t } from "#src/locales";\n\nconst ${pascalName}Page = lazy(() => import("#src/pages/${config.module}/${config.name}"));\n\nconst routes: AppRouteRecordRaw[] = [\n\t{\n\t\tpath: ${quote(`/${config.module}`)},\n\t\tComponent: ContainerLayout,\n\t\thandle: {\n\t\t\torder: 200,\n\t\t\ttitle: $t(${quote(`${config.module}.title`)}),\n\t\t\ticon: ${quote(config.menuIcon)},\n\t\t},\n\t\tchildren: [\n${renderChildRouteEntry(config)}\n\t\t],\n\t},\n];\n\nexport default routes;\n`;
}

/** Index (0-based) just past the `]` matching the `[` at `content[openIndex]`. */
function findMatchingBracketEnd(content, openIndex) {
	let depth = 0;
	for (let index = openIndex; index < content.length; index += 1) {
		if (content[index] === "[") {
			depth += 1;
		}
		else if (content[index] === "]") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}
	throw new Error("Không tìm thấy dấu `]` khớp với `children: [` trong file route hiện có.");
}

/** `module !== name`, this module's group file already exists: append this page as a new sibling. */
function appendRouteChild(existingContent, config) {
	const pascalName = toPascalCase(config.name);
	const importLine = `const ${pascalName}Page = lazy(() => import(${quote(`#src/pages/${config.module}/${config.name}`)}));`;

	if (existingContent.includes(importLine)) {
		// Already generated before (e.g. re-run with --force) — nothing new to append.
		return existingContent;
	}

	const importPattern = /^const \w+Page = lazy\(.*\);$/gm;
	let lastImportMatch;
	for (const match of existingContent.matchAll(importPattern)) {
		lastImportMatch = match;
	}
	if (!lastImportMatch) {
		throw new Error("Không tìm thấy dòng `const XPage = lazy(...)` nào trong file route hiện có để chèn thêm.");
	}
	const insertImportAt = lastImportMatch.index + lastImportMatch[0].length;
	let content = `${existingContent.slice(0, insertImportAt)}\n${importLine}${existingContent.slice(insertImportAt)}`;

	const childrenKeyIndex = content.indexOf("children: [");
	if (childrenKeyIndex === -1) {
		throw new Error("Không tìm thấy `children: [` trong file route hiện có để chèn thêm.");
	}
	const openBracketIndex = childrenKeyIndex + "children: ".length;
	const closeBracketIndex = findMatchingBracketEnd(content, openBracketIndex);

	// Insert right after the previous last element's trailing comma (every element in a
	// generator-authored array ends with one), so the existing whitespace before `]` is preserved
	// as-is instead of duplicated.
	let insertAt = closeBracketIndex;
	while (insertAt > 0 && /\s/.test(content[insertAt - 1])) {
		insertAt -= 1;
	}
	content = `${content.slice(0, insertAt)}\n${renderChildRouteEntry(config)}${content.slice(insertAt)}`;

	return content;
}

/** Group-level menu title, e.g. `src/locales/vi-VN/master-data.json` — created once, for the first page in a new module group. */
function renderModuleLocale(config, language) {
	const isVietnamese = language === "vi-VN";
	return `${JSON.stringify({ title: isVietnamese ? config.groupTitle : config.groupTitleEn }, null, "\t")}\n`;
}

function renderLocale(config, language) {
	const isVietnamese = language === "vi-VN";
	const labelFor = field => isVietnamese ? field.label : field.labelEn;
	const table = {};
	const form = {};
	const optionGroups = {};

	for (const field of config.fields) {
		const text = labelFor(field);
		if (field.table || field.detail) {
			table[field.name] = text;
		}
		if (field.form) {
			form[field.name] = text;
			if (field.required) {
				form[`${field.name}Required`] = isVietnamese ? `Vui lòng nhập ${text.toLowerCase()}` : `Please enter ${text.toLowerCase()}`;
			}
		}
		if (field.type === "select") {
			optionGroups[`${field.name}Options`] = Object.fromEntries(
				field.options.map(option => [String(option.value), isVietnamese ? option.label : option.labelEn]),
			);
		}
	}

	const result = {
		title: isVietnamese ? config.title : config.titleEn,
		table,
		form,
		...optionGroups,
	};
	return `${JSON.stringify(result, null, "\t")}\n`;
}

async function fileExists(filePath) {
	try {
		await access(filePath, constants.F_OK);
		return true;
	}
	catch {
		return false;
	}
}

export async function generateCrud(rawConfig, options = {}) {
	const config = normalizeConfig(rawConfig);
	const outputRoot = path.resolve(options.outputRoot ?? process.cwd());

	// `module === name`: this page owns its own top-level menu entry (one file, unrelated to any
	// other module). `module !== name`: this page is one of possibly several sharing a menu group
	// — all of them live in ONE route file per module (`src/router/routes/modules/<module>.ts`),
	// so a second `generate:crud` call for a sibling page appends into the existing file instead of
	// creating a competing top-level menu entry.
	const routeRelativePath = config.isGroup
		? `src/router/routes/modules/${config.module}.ts`
		: `src/router/routes/modules/${config.name}.ts`;
	const routeAbsolutePath = path.resolve(outputRoot, routeRelativePath);
	const routeFileAlreadyExists = config.isGroup && await fileExists(routeAbsolutePath);
	const routeContent = routeFileAlreadyExists
		? appendRouteChild(await readFile(routeAbsolutePath, "utf8"), config)
		: config.isGroup
			? renderRouteGroup(config)
			: renderStandaloneRoute(config);

	const files = [
		{ relativePath: `src/domain/${config.module}/${config.name}/${config.name}.entity.ts`, content: renderEntity(config) },
		{ relativePath: `src/domain/${config.module}/${config.name}/${config.name}.repository.ts`, content: renderRepositoryInterface(config) },
		{ relativePath: `src/domain/${config.module}/${config.name}/index.ts`, content: renderDomainIndex(config) },
		{ relativePath: `src/infrastructure/${config.module}/${config.name}/${config.name}.repository.ts`, content: renderRepositoryImpl(config) },
		{ relativePath: `src/infrastructure/${config.module}/${config.name}/index.ts`, content: renderInfrastructureIndex(config) },
		{ relativePath: `src/application/${config.module}/${config.name}/list-${config.name}s.ts`, content: renderApplicationList(config) },
		{ relativePath: `src/application/${config.module}/${config.name}/get-${config.name}-detail.ts`, content: renderApplicationDetail(config) },
		{ relativePath: `src/application/${config.module}/${config.name}/use-${config.name}-mutations.ts`, content: renderApplicationMutations(config) },
		{ relativePath: `src/application/${config.module}/${config.name}/index.ts`, content: renderApplicationIndex(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/constants.tsx`, content: renderConstants(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/components/${config.name}-drawer.tsx`, content: renderDrawer(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/index.tsx`, content: renderPage(config) },
		// `mergeable`: writing this file is always safe even without --force — a brand-new group
		// file is new content, and appending a sibling only adds to what's already there.
		{ relativePath: routeRelativePath, content: routeContent, mergeable: true },
		{ relativePath: `src/locales/vi-VN/${config.name}.json`, content: renderLocale(config, "vi-VN") },
		{ relativePath: `src/locales/en-US/${config.name}.json`, content: renderLocale(config, "en-US") },
		// Group-level menu title — only created alongside a brand-new group file. An existing
		// group's title is presumed already set (possibly hand-edited since); appending a sibling
		// page never touches it.
		...(config.isGroup && !routeFileAlreadyExists
			? [
				{ relativePath: `src/locales/vi-VN/${config.module}.json`, content: renderModuleLocale(config, "vi-VN") },
				{ relativePath: `src/locales/en-US/${config.module}.json`, content: renderModuleLocale(config, "en-US") },
			]
			: []),
	].map(file => ({ ...file, absolutePath: path.resolve(outputRoot, file.relativePath) }));

	for (const file of files) {
		if (path.relative(outputRoot, file.absolutePath).startsWith("..")) {
			throw new Error(`Đường dẫn output không an toàn: ${file.relativePath}`);
		}
	}
	return { config, files, outputRoot };
}

export async function writeGeneratedFiles(generated, options = {}) {
	const existingFiles = [];
	for (const file of generated.files) {
		if (!file.mergeable && await fileExists(file.absolutePath)) {
			existingFiles.push(file.relativePath);
		}
	}
	if (existingFiles.length > 0 && !options.force) {
		throw new Error(`Các file đã tồn tại:\n- ${existingFiles.join("\n- ")}\nDùng --force nếu bạn thực sự muốn ghi đè.`);
	}
	if (options.dryRun)
		return;

	for (const file of generated.files) {
		await mkdir(path.dirname(file.absolutePath), { recursive: true });
		await writeFile(file.absolutePath, file.content, "utf8");
	}
}

export async function loadConfig(configPath) {
	const absolutePath = path.resolve(process.cwd(), configPath);
	try {
		return JSON.parse(await readFile(absolutePath, "utf8"));
	}
	catch (error) {
		throw new Error(`Không đọc được config ${configPath}: ${error.message}`);
	}
}

const VALUE_FLAGS = ["--config", "--output-root", "--module", "--title", "--title-en", "--group-title", "--group-title-en", "--endpoint", "--id-field", "--id-type", "--menu-icon"];
const VALUE_FLAG_TO_OPTION = {
	"--config": "config",
	"--output-root": "outputRoot",
	"--module": "module",
	"--title": "title",
	"--title-en": "titleEn",
	"--group-title": "groupTitle",
	"--group-title-en": "groupTitleEn",
	"--endpoint": "endpoint",
	"--id-field": "idField",
	"--id-type": "idType",
	"--menu-icon": "menuIcon",
};

export function parseArguments(args) {
	const options = {
		name: undefined,
		module: undefined,
		title: undefined,
		titleEn: undefined,
		groupTitle: undefined,
		groupTitleEn: undefined,
		endpoint: undefined,
		idField: undefined,
		idType: undefined,
		menuIcon: undefined,
		config: undefined,
		outputRoot: undefined,
		dryRun: false,
		force: false,
		help: false,
	};
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		// Supports both `--flag value` and `--flag=value`.
		const equalsIndex = argument.startsWith("--") ? argument.indexOf("=") : -1;
		const flagName = equalsIndex === -1 ? argument : argument.slice(0, equalsIndex);
		if (VALUE_FLAGS.includes(flagName)) {
			const value = equalsIndex === -1 ? args[index + 1] : argument.slice(equalsIndex + 1);
			if (equalsIndex === -1) {
				if (!value || value.startsWith("--"))
					throw new Error(`${flagName} cần một giá trị.`);
				index += 1;
			}
			else if (!value) {
				throw new Error(`${flagName} cần một giá trị.`);
			}
			options[VALUE_FLAG_TO_OPTION[flagName]] = value;
		}
		else if (argument === "--dry-run") {
			options.dryRun = true;
		}
		else if (argument === "--force") {
			options.force = true;
		}
		else if (argument === "--help" || argument === "-h") {
			options.help = true;
		}
		else if (!argument.startsWith("--")) {
			if (options.name) {
				throw new Error(`Chỉ nhận một tên resource, đã có "${options.name}", thừa "${argument}".`);
			}
			options.name = argument;
		}
		else {
			throw new Error(`Tham số không hỗ trợ: ${argument}`);
		}
	}
	return options;
}

/**
 * Default field set for `yarn generate:crud <name>` (no --config) — just enough to init
 * quickly: code, name, description. Edit the generated domain entity/repository afterward
 * once the real schema is known.
 */
export const QUICK_DEFAULT_FIELDS = [
	{ name: "code", label: "Mã", labelEn: "Code", type: "text", required: true, table: true, search: true, form: true, detail: true },
	{ name: "name", label: "Tên", labelEn: "Name", type: "text", required: true, table: true, search: true, form: true, detail: true },
	{ name: "description", label: "Mô tả", labelEn: "Description", type: "textarea", required: false, table: false, search: false, form: true, detail: true },
];

/** Builds a `generateCrud` config straight from CLI flags — no `--config` JSON, no interactive prompts. */
export function buildQuickConfig(options) {
	return {
		name: options.name,
		module: options.module ?? options.name,
		title: options.title,
		titleEn: options.titleEn,
		groupTitle: options.groupTitle,
		groupTitleEn: options.groupTitleEn,
		menuIcon: options.menuIcon,
		endpoint: options.endpoint,
		idField: options.idField,
		idType: options.idType,
		fields: QUICK_DEFAULT_FIELDS,
	};
}

export function printHelp() {
	console.log(`Tạo module CRUD theo convention của React Antd Admin (clean architecture: domain / infrastructure / application / presentation — xem .claude/skills/clean-architecture/SKILL.md).

Chạy xong là vào được ngay qua menu (route + i18n vi-VN/en-US được sinh tự động, không cần bước thủ công nào thêm).

--module khác <name> ⇒ trang này chia sẻ MỘT nhóm menu với các trang khác cùng --module (giống Quản lý hệ thống > Người dùng/Vai trò/Menu/Phòng ban): gọi generate:crud nhiều lần cùng --module sẽ tự chèn thêm trang mới vào route đã có, không tạo trùng nhóm menu.

Cách dùng:
  yarn generate:crud <name> [options]              Sinh ngay với field mặc định (code, name, description)
  yarn generate:crud --config <file>                Sinh từ JSON khi cần khai báo field tuỳ chỉnh
  yarn generate:crud                                Hỏi tương tác từng field

Ví dụ (2 trang chung 1 nhóm menu "Master Data"):
  yarn generate:crud order-report --module=master-data --group-title="Dữ liệu chủ" --group-title-en="Master Data" --title="Báo cáo đơn hàng" --title-en="Order report"
  yarn generate:crud stock-item --module=master-data --title="Tồn kho" --title-en="Stock item"

Tùy chọn:
  --module <name>             Nhóm thư mục dạng kebab-case, mặc định trùng <name> (trùng ⇒ trang có menu riêng; khác ⇒ trang nằm trong nhóm menu của --module)
  --title <text>               Tên hiển thị tiếng Việt của trang, mặc định là PascalCase của <name>
  --title-en <text>            Tên hiển thị tiếng Anh của trang, mặc định trùng --title
  --group-title <text>         Tên nhóm menu tiếng Việt (chỉ dùng khi tạo nhóm mới), mặc định Title Case của --module
  --group-title-en <text>      Tên nhóm menu tiếng Anh, mặc định trùng --group-title
  --menu-icon <IconOutlined>   Icon Ant Design cho menu (trang đơn hoặc nhóm mới), mặc định AppstoreOutlined
  --endpoint <path>             REST endpoint, mặc định <name>s
  --id-field <name>             Tên khóa chính, mặc định id
  --id-type <string|number>     Kiểu khóa chính, mặc định number
  --config <file>              Sinh code từ JSON (field tuỳ chỉnh, hỗ trợ labelEn/titleEn/groupTitle/groupTitleEn) thay vì mặc định/hỏi tương tác
  --output-root <path>         Thư mục gốc nhận src/ (hữu ích khi kiểm thử)
  --dry-run                    Kiểm tra config và in danh sách file, không ghi file
  --force                      Ghi đè các file CRUD đã tồn tại
  --help, -h                   Hiển thị trợ giúp
`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
	printHelp();
}
