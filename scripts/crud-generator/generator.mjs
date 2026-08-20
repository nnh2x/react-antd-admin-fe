import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SUPPORTED_FIELD_TYPES = new Set(["text", "textarea", "number", "select", "boolean", "date", "datetime"]);
const IDENTIFIER_PATTERN = /^[a-z_$][\w$]*$/i;
const PATH_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
	return { label: option.label, value: option.value };
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
	const normalized = {
		name: field.name,
		label: typeof field.label === "string" && field.label.trim() ? field.label.trim() : field.name,
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

	return {
		name,
		module: moduleName,
		title: typeof rawConfig.title === "string" && rawConfig.title.trim() ? rawConfig.title.trim() : toPascalCase(name),
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

function renderTypes(config) {
	const pascalName = toPascalCase(config.name);
	const itemFields = [
		`${config.idField}: ${config.idType}`,
		...config.fields.map(field => `${field.name}${field.required ? "" : "?"}: ${typeForField(field)}`),
	];
	const formFieldNames = config.fields.filter(field => field.form).map(field => quote(field.name)).join(" | ");

	return `export interface ${pascalName}Item {\n${indent(itemFields.join("\n"))}\n}\n\nexport type Create${pascalName}Input = Pick<${pascalName}Item, ${formFieldNames}>;\n\nexport type Update${pascalName}Input = Create${pascalName}Input & Pick<${pascalName}Item, ${quote(config.idField)}>;\n\nexport interface ${pascalName}Query extends ApiTableRequest {\n${indent(config.fields.filter(field => field.search).map(field => `${field.name}?: ${typeForField(field)}`).join("\n"))}\n}\n`;
}

function renderApi(config) {
	const pascalName = toPascalCase(config.name);
	return `import type {\n\tCreate${pascalName}Input,\n\t${pascalName}Item,\n\t${pascalName}Query,\n\tUpdate${pascalName}Input,\n} from "./types";\nimport { request } from "#src/utils/request";\n\nexport * from "./types";\n\nconst RESOURCE_URL = ${quote(config.endpoint)};\nconst resourceUrl = (id: ${pascalName}Item[${quote(config.idField)}]) => [RESOURCE_URL, encodeURIComponent(String(id))].join("/");\n\nexport function fetch${pascalName}List(data: ${pascalName}Query) {\n\treturn request.get<ApiListResponse<${pascalName}Item>>(RESOURCE_URL, { searchParams: data, ignoreLoading: true }).json();\n}\n\nexport function fetch${pascalName}Detail(id: ${pascalName}Item[${quote(config.idField)}]) {\n\treturn request.get<ApiResponse<${pascalName}Item>>(resourceUrl(id)).json();\n}\n\nexport function create${pascalName}(data: Create${pascalName}Input) {\n\treturn request.post<ApiResponse<${pascalName}Item>>(RESOURCE_URL, { json: data }).json();\n}\n\nexport function update${pascalName}(data: Update${pascalName}Input) {\n\treturn request.put<ApiResponse<${pascalName}Item>>(resourceUrl(data.${config.idField}), { json: data }).json();\n}\n\nexport function delete${pascalName}(id: ${pascalName}Item[${quote(config.idField)}]) {\n\treturn request.delete<ApiResponse<${pascalName}Item[${quote(config.idField)}]>>(resourceUrl(id)).json();\n}\n`;
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

function renderValueEnum(field) {
	if (field.type !== "select")
		return "";
	const entries = field.options.map(option => `${quote(option.value)}: { text: ${quote(option.label)} },`).join("\n");
	return `\n\tvalueEnum: {\n${indent(entries, 2)}\n\t},`;
}

function renderColumn(field) {
	return `{\n\ttitle: ${quote(field.label)},\n\tdataIndex: ${quote(field.name)},\n\tvalueType: ${quote(valueTypeForField(field))},\n\tsearch: ${field.search},${renderValueEnum(field)}\n}`;
}

function renderDetailColumn(field) {
	return `{\n\ttitle: ${quote(field.label)},\n\tdataIndex: ${quote(field.name)},\n\tvalueType: ${quote(valueTypeForField(field))},${renderValueEnum(field)}\n}`;
}

function renderConstants(config) {
	const pascalName = toPascalCase(config.name);
	const tableColumns = config.fields.filter(field => field.table).map(renderColumn);
	const detailFields = [
		{ name: config.idField, label: config.idLabel, type: config.idType === "number" ? "number" : "text" },
		...config.fields.filter(field => field.detail),
	].map(renderDetailColumn);

	return `import type { ProColumns, ProDescriptionsItemProps } from "@ant-design/pro-components";\nimport type { ${pascalName}Item } from "#src/api/${config.module}/${config.name}";\n\nexport const ${config.name.replaceAll("-", "_").toUpperCase()}_TITLE = ${quote(config.title)};\n\nexport const ${config.name.replaceAll("-", "_").toUpperCase()}_COLUMNS: ProColumns<${pascalName}Item>[] = [\n\t{\n\t\ttitle: "STT",\n\t\tvalueType: "indexBorder",\n\t\twidth: 72,\n\t\tsearch: false,\n\t},\n${indent(tableColumns.map(column => `${column},`).join("\n"))}\n];\n\nexport const ${config.name.replaceAll("-", "_").toUpperCase()}_DETAIL_COLUMNS: ProDescriptionsItemProps<${pascalName}Item>[] = [\n${indent(detailFields.map(column => `${column},`).join("\n"))}\n];\n`;
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

function renderFormField(field) {
	const component = formComponentForField(field);
	const options = field.type === "select"
		? `\n\toptions={[\n${indent(field.options.map(option => `{ label: ${quote(option.label)}, value: ${quote(option.value)} },`).join("\n"), 2)}\n\t]}`
		: "";
	return `<${component}\n\tname=${quote(field.name)}\n\tlabel=${quote(field.label)}\n\trules={[{ required: ${field.required}, message: ${quote(`Vui lòng nhập ${field.label.toLowerCase()}`)} }]}${options}\n/>`;
}

function renderDrawer(config) {
	const pascalName = toPascalCase(config.name);
	const formFields = config.fields.filter(field => field.form);
	const formComponents = [...new Set(formFields.map(formComponentForField))].sort();
	const initialValues = formFields
		.filter(field => field.initialValue !== undefined)
		.map(field => `${field.name}: ${quote(field.initialValue)},`)
		.join("\n");
	const fieldMarkup = formFields.map(renderFormField).join("\n\n");
	const constantPrefix = config.name.replaceAll("-", "_").toUpperCase();

	return `import type { Create${pascalName}Input, ${pascalName}Item } from "#src/api/${config.module}/${config.name}";\nimport {\n\tDrawerForm,\n\tProDescriptions,\n${indent(formComponents.map(component => `${component},`).join("\n"))}\n} from "@ant-design/pro-components";\nimport { useMutation } from "@tanstack/react-query";\nimport { Drawer, Form } from "antd";\nimport { useEffect } from "react";\nimport { useTranslation } from "react-i18next";\nimport { create${pascalName}, update${pascalName} } from "#src/api/${config.module}/${config.name}";\n\nimport { ${constantPrefix}_DETAIL_COLUMNS, ${constantPrefix}_TITLE } from "../constants";\n\nexport type ${pascalName}DrawerMode = "create" | "edit" | "view";\n\ninterface ${pascalName}DrawerProps {\n\tmode: ${pascalName}DrawerMode\n\topen: boolean\n\tdetailData: Partial<${pascalName}Item>\n\tonClose: () => void\n\tonSuccess: () => void\n}\n\nexport function ${pascalName}Drawer({ mode, open, detailData, onClose, onSuccess }: ${pascalName}DrawerProps) {\n\tconst { t } = useTranslation();\n\tconst [form] = Form.useForm<Create${pascalName}Input>();\n\tconst createMutation = useMutation({ mutationFn: create${pascalName} });\n\tconst updateMutation = useMutation({ mutationFn: update${pascalName} });\n\tconst title = [\n\t\tmode === "create" ? t("common.add") : mode === "edit" ? t("common.update") : t("common.view"),\n\t\t${constantPrefix}_TITLE,\n\t].join(" ");\n\n\tuseEffect(() => {\n\t\tif (!open || mode === "view")\n\t\t\treturn;\n\t\tform.resetFields();\n\t\tform.setFieldsValue(detailData);\n\t}, [detailData, form, mode, open]);\n\n\tif (mode === "view") {\n\t\treturn (\n\t\t\t<Drawer title={title} open={open} width={640} onClose={onClose} destroyOnHidden>\n\t\t\t\t<ProDescriptions<${pascalName}Item>\n\t\t\t\t\tcolumn={1}\n\t\t\t\t\tcolumns={${constantPrefix}_DETAIL_COLUMNS}\n\t\t\t\t\tdataSource={detailData as ${pascalName}Item}\n\t\t\t\t/>\n\t\t\t</Drawer>\n\t\t);\n\t}\n\n\tconst onFinish = async (values: Create${pascalName}Input) => {\n\t\tif (mode === "edit") {\n\t\t\tconst recordId = detailData.${config.idField};\n\t\t\tif (recordId === undefined || recordId === null)\n\t\t\t\tthrow new Error("Không tìm thấy khóa chính của bản ghi.");\n\t\t\tawait updateMutation.mutateAsync({ ...values, ${config.idField}: recordId });\n\t\t\twindow.$message?.success(t("common.updateSuccess"));\n\t\t}\n\t\telse {\n\t\t\tawait createMutation.mutateAsync(values);\n\t\t\twindow.$message?.success(t("common.addSuccess"));\n\t\t}\n\t\tonSuccess();\n\t\treturn true;\n\t};\n\n\treturn (\n\t\t<DrawerForm<Create${pascalName}Input>\n\t\t\ttitle={title}\n\t\t\topen={open}\n\t\t\tform={form}\n\t\t\tinitialValues={{\n${indent(initialValues, 4)}\n\t\t\t}}\n\t\t\tdrawerProps={{ destroyOnHidden: true }}\n\t\t\tresize={{ minWidth: 480, maxWidth: window.innerWidth * 0.8 }}\n\t\t\tonOpenChange={visible => !visible && onClose()}\n\t\t\tonFinish={onFinish}\n\t\t>\n${indent(fieldMarkup, 3)}\n\t\t</DrawerForm>\n\t);\n}\n`;
}

function renderPage(config) {
	const pascalName = toPascalCase(config.name);
	const constantPrefix = config.name.replaceAll("-", "_").toUpperCase();
	return `import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";\nimport type { ${pascalName}Item, ${pascalName}Query } from "#src/api/${config.module}/${config.name}";\nimport type { ${pascalName}DrawerMode } from "./components/${config.name}-drawer";\n\nimport { PlusCircleOutlined } from "@ant-design/icons";\nimport { useMutation } from "@tanstack/react-query";\nimport { Button, Popconfirm } from "antd";\nimport { useRef, useState } from "react";\nimport { useTranslation } from "react-i18next";\nimport { delete${pascalName}, fetch${pascalName}Detail, fetch${pascalName}List } from "#src/api/${config.module}/${config.name}";\nimport { BasicButton } from "#src/components/basic-button";\nimport { BasicContent } from "#src/components/basic-content";\nimport { BasicTable } from "#src/components/basic-table";\nimport { accessControlCodes, useAccess } from "#src/hooks/use-access";\n\nimport { ${pascalName}Drawer } from "./components/${config.name}-drawer";\nimport { ${constantPrefix}_COLUMNS, ${constantPrefix}_TITLE } from "./constants";\n\nexport default function ${pascalName}Page() {\n\tconst { t } = useTranslation();\n\tconst { hasAccessByCodes } = useAccess();\n\tconst actionRef = useRef<ActionType>(null);\n\tconst [drawerOpen, setDrawerOpen] = useState(false);\n\tconst [drawerMode, setDrawerMode] = useState<${pascalName}DrawerMode>("view");\n\tconst [detailData, setDetailData] = useState<Partial<${pascalName}Item>>({});\n\tconst deleteMutation = useMutation({ mutationFn: delete${pascalName} });\n\n\tconst closeDrawer = () => {\n\t\tsetDrawerOpen(false);\n\t\tsetDetailData({});\n\t};\n\n\tconst openDrawer = async (mode: ${pascalName}DrawerMode, record?: ${pascalName}Item) => {\n\t\tsetDrawerMode(mode);\n\t\tif (mode === "create") {\n\t\t\tsetDetailData({});\n\t\t}\n\t\telse if (record) {\n\t\t\tconst response = await fetch${pascalName}Detail(record.${config.idField});\n\t\t\tsetDetailData(response.result);\n\t\t}\n\t\tsetDrawerOpen(true);\n\t};\n\n\tconst handleDelete = async (record: ${pascalName}Item, action?: ProCoreActionType<object>) => {\n\t\tawait deleteMutation.mutateAsync(record.${config.idField});\n\t\twindow.$message?.success(t("common.deleteSuccess"));\n\t\tawait action?.reload?.();\n\t};\n\n\tconst columns: ProColumns<${pascalName}Item>[] = [\n\t\t...${constantPrefix}_COLUMNS,\n\t\t{\n\t\t\ttitle: t("common.action"),\n\t\t\tvalueType: "option",\n\t\t\tkey: "actions",\n\t\t\tsearch: false,\n\t\t\tfixed: "right",\n\t\t\twidth: 180,\n\t\t\trender: (_, record, __, action) => [\n\t\t\t\t<BasicButton key="view" type="link" size="small" onClick={() => openDrawer("view", record)}>\n\t\t\t\t\t{t("common.view")}\n\t\t\t\t</BasicButton>,\n\t\t\t\t<BasicButton\n\t\t\t\t\tkey="edit"\n\t\t\t\t\ttype="link"\n\t\t\t\t\tsize="small"\n\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.update)}\n\t\t\t\t\tonClick={() => openDrawer("edit", record)}\n\t\t\t\t>\n\t\t\t\t\t{t("common.edit")}\n\t\t\t\t</BasicButton>,\n\t\t\t\t<Popconfirm\n\t\t\t\t\tkey="delete"\n\t\t\t\t\ttitle={t("common.confirmDelete")}\n\t\t\t\t\tokText={t("common.confirm")}\n\t\t\t\t\tcancelText={t("common.cancel")}\n\t\t\t\t\tonConfirm={() => handleDelete(record, action)}\n\t\t\t\t>\n\t\t\t\t\t<BasicButton type="link" size="small" disabled={!hasAccessByCodes(accessControlCodes.delete)}>\n\t\t\t\t\t\t{t("common.delete")}\n\t\t\t\t\t</BasicButton>\n\t\t\t\t</Popconfirm>,\n\t\t\t],\n\t\t},\n\t];\n\n\treturn (\n\t\t<BasicContent className="h-full">\n\t\t\t<BasicTable<${pascalName}Item, ${pascalName}Query>\n\t\t\t\tadaptive\n\t\t\t\tactionRef={actionRef}\n\t\t\t\tcolumns={columns}\n\t\t\t\tcolumnsState={{\n\t\t\t\t\tpersistenceKey: ${quote(`${config.module}-${config.name}-columns`)},\n\t\t\t\t\tpersistenceType: "localStorage",\n\t\t\t\t}}\n\t\t\t\theaderTitle={${constantPrefix}_TITLE}\n\t\t\t\trequest={async (params) => {\n\t\t\t\t\tconst response = await fetch${pascalName}List(params);\n\t\t\t\t\treturn {\n\t\t\t\t\t\tdata: response.result.list,\n\t\t\t\t\t\ttotal: response.result.total,\n\t\t\t\t\t\tsuccess: response.success,\n\t\t\t\t\t};\n\t\t\t\t}}\n\t\t\t\ttoolBarRender={() => [\n\t\t\t\t\t<Button\n\t\t\t\t\t\tkey="create"\n\t\t\t\t\t\ttype="primary"\n\t\t\t\t\t\ticon={<PlusCircleOutlined />}\n\t\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.add)}\n\t\t\t\t\t\tonClick={() => openDrawer("create")}\n\t\t\t\t\t>\n\t\t\t\t\t\t{t("common.add")}\n\t\t\t\t\t</Button>,\n\t\t\t\t]}\n\t\t\t/>\n\t\t\t<${pascalName}Drawer\n\t\t\t\tmode={drawerMode}\n\t\t\t\topen={drawerOpen}\n\t\t\t\tdetailData={detailData}\n\t\t\t\tonClose={closeDrawer}\n\t\t\t\tonSuccess={() => {\n\t\t\t\t\tcloseDrawer();\n\t\t\t\t\tactionRef.current?.reload();\n\t\t\t\t}}\n\t\t\t/>\n\t\t</BasicContent>\n\t);\n}\n`;
}

export function generateCrud(rawConfig, options = {}) {
	const config = normalizeConfig(rawConfig);
	const outputRoot = path.resolve(options.outputRoot ?? process.cwd());
	const files = [
		{ relativePath: `src/api/${config.module}/${config.name}/types.ts`, content: renderTypes(config) },
		{ relativePath: `src/api/${config.module}/${config.name}/index.ts`, content: renderApi(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/constants.ts`, content: renderConstants(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/components/${config.name}-drawer.tsx`, content: renderDrawer(config) },
		{ relativePath: `src/pages/${config.module}/${config.name}/index.tsx`, content: renderPage(config) },
	].map(file => ({ ...file, absolutePath: path.resolve(outputRoot, file.relativePath) }));

	for (const file of files) {
		if (path.relative(outputRoot, file.absolutePath).startsWith("..")) {
			throw new Error(`Đường dẫn output không an toàn: ${file.relativePath}`);
		}
	}
	return { config, files, outputRoot };
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

export async function writeGeneratedFiles(generated, options = {}) {
	const existingFiles = [];
	for (const file of generated.files) {
		if (await fileExists(file.absolutePath)) {
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

export function parseArguments(args) {
	const options = { config: undefined, outputRoot: undefined, dryRun: false, force: false, help: false };
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--config" || argument === "--output-root") {
			const value = args[index + 1];
			if (!value || value.startsWith("--"))
				throw new Error(`${argument} cần một giá trị.`);
			if (argument === "--config")
				options.config = value;
			else
				options.outputRoot = value;
			index += 1;
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
		else {
			throw new Error(`Tham số không hỗ trợ: ${argument}`);
		}
	}
	return options;
}

export function printHelp() {
	console.log(`Tạo module CRUD theo convention của React Antd Admin.

Cách dùng:
  yarn generate:crud
  yarn generate:crud --config scripts/crud-generator/example.json

Tùy chọn:
  --config <file>       Sinh code từ JSON thay vì hỏi tương tác
  --output-root <path>  Thư mục gốc nhận src/ (hữu ích khi kiểm thử)
  --dry-run             Kiểm tra config và in danh sách file, không ghi file
  --force               Ghi đè các file CRUD đã tồn tại
  --help, -h            Hiển thị trợ giúp
`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
	printHelp();
}
