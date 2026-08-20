#!/usr/bin/env node
/**
 * React Antd Admin Feature Generator CLI
 *
 * Usage:
 *   yarn gen <feature-name> [options]
 *
 * Examples:
 *   yarn gen product --title="Sản phẩm"
 *   yarn gen order-report --folder=master-data --title="Báo cáo đơn hàng"
 *
 * Options:
 *   --folder=<folder>          Tạo trong folder có sẵn
 *   --title=<title>            Tiêu đề tiếng Việt
 *   --title-en=<title>         Tiêu đề tiếng Anh
 *   --api-endpoint=<endpoint>  REST API endpoint base (mặc định: feature-name)
 *   --menu-icon=<icon>         Ant Design icon name (mặc định: AppstoreOutlined)
 *   --skip-api                 Bỏ qua tạo API layer
 *   --skip-modals              Bỏ qua create/update drawers
 *   --skip-detail              Bỏ qua detail drawer
 *   --dry-run                  Chỉ hiển thị file sẽ tạo
 *   --force                    Cho phép ghi đè file đã tồn tại
 */

import { constants } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ICON_PATTERN = /^[A-Z][A-Za-z0-9]*Outlined$/;

function toPascalCase(value) {
	return value
		.split(/[-_]/)
		.filter(Boolean)
		.map(word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
		.join("");
}

function toCamelCase(value) {
	const pascalCase = toPascalCase(value);
	return `${pascalCase.charAt(0).toLowerCase()}${pascalCase.slice(1)}`;
}

function toKebabCase(value) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();
}

function readOptionValue(argument, optionName) {
	const prefix = `--${optionName}=`;
	return argument.startsWith(prefix) ? argument.slice(prefix.length) : undefined;
}

function printHelp() {
	console.log(`React Antd Admin Feature Generator

Usage:
  yarn gen <feature-name> [options]

Examples:
  yarn gen product --title="Sản phẩm"
  yarn gen order-report --folder=master-data --title="Báo cáo đơn hàng"

Options:
  --folder=<folder>          Nhóm page/API
  --title=<title>            Tiêu đề tiếng Việt
  --title-en=<title>         Tiêu đề tiếng Anh
  --api-endpoint=<endpoint>  REST endpoint base
  --menu-icon=<icon>         Ant Design icon name
  --skip-api                 Không tạo API layer
  --skip-modals              Không tạo create/update drawers
  --skip-detail              Không tạo detail drawer
  --dry-run                  Không ghi file
  --force                    Ghi đè file đã tồn tại
  --help, -h                 Hiển thị trợ giúp
`);
}

function parseArguments(args) {
	if (args.includes("--help") || args.includes("-h")) {
		return { help: true };
	}

	const featureArgument = args.find(argument => !argument.startsWith("--"));
	if (!featureArgument) {
		throw new Error("Vui lòng cung cấp tên feature. Ví dụ: yarn gen product --title=\"Sản phẩm\"");
	}

	const featureName = toKebabCase(featureArgument);
	if (!KEBAB_CASE_PATTERN.test(featureName)) {
		throw new Error("Tên feature phải ở dạng kebab-case và không được chứa đường dẫn cha.");
	}

	const options = {
		help: false,
		featureName,
		folder: undefined,
		title: undefined,
		titleEn: undefined,
		apiEndpoint: featureName,
		menuIcon: "AppstoreOutlined",
		skipApi: false,
		skipModals: false,
		skipDetail: false,
		dryRun: false,
		force: false,
	};

	for (const argument of args) {
		if (argument === featureArgument)
			continue;

		const folder = readOptionValue(argument, "folder");
		const title = readOptionValue(argument, "title");
		const titleEn = readOptionValue(argument, "title-en");
		const apiEndpoint = readOptionValue(argument, "api-endpoint");
		const menuIcon = readOptionValue(argument, "menu-icon");

		if (folder !== undefined)
			options.folder = toKebabCase(folder);
		else if (title !== undefined)
			options.title = title;
		else if (titleEn !== undefined)
			options.titleEn = titleEn;
		else if (apiEndpoint !== undefined)
			options.apiEndpoint = apiEndpoint.replace(/^\/+|\/+$/g, "");
		else if (menuIcon !== undefined)
			options.menuIcon = menuIcon;
		else if (argument === "--skip-api")
			options.skipApi = true;
		else if (argument === "--skip-modals")
			options.skipModals = true;
		else if (argument === "--skip-detail")
			options.skipDetail = true;
		else if (argument === "--dry-run")
			options.dryRun = true;
		else if (argument === "--force")
			options.force = true;
		else
			throw new Error(`Option không được hỗ trợ: ${argument}`);
	}

	if (options.folder && !KEBAB_CASE_PATTERN.test(options.folder)) {
		throw new Error("folder phải ở dạng kebab-case.");
	}
	if (!options.apiEndpoint || options.apiEndpoint.includes("..") || /^[a-z][a-z\d+.-]*:\/\//i.test(options.apiEndpoint)) {
		throw new Error("api-endpoint phải là đường dẫn tương đối hợp lệ.");
	}
	if (!ICON_PATTERN.test(options.menuIcon)) {
		throw new Error("menu-icon phải là tên Ant Design icon, ví dụ AppstoreOutlined.");
	}

	return options;
}

function buildFeatureSpec(options) {
	const names = {
		kebab: options.featureName,
		pascal: toPascalCase(options.featureName),
		camel: toCamelCase(options.featureName),
		title: options.title || toPascalCase(options.featureName),
		titleEn: options.titleEn || toPascalCase(options.featureName),
	};
	const moduleName = options.folder || names.kebab;
	const pageRelativePath = `src/pages/${moduleName}/${names.kebab}`;
	const apiRelativePath = options.folder
		? `src/api/${moduleName}/${names.kebab}`
		: `src/api/${names.kebab}`;
	const apiAlias = `#${apiRelativePath}`;
	const routePath = options.folder ? `/${options.folder}/${names.kebab}` : `/${names.kebab}`;

	return {
		options,
		names,
		moduleName,
		pageRelativePath,
		apiRelativePath,
		apiAlias,
		routePath,
	};
}

function renderApiTypes({ names }) {
	return `export interface ${names.pascal}Item {\n\tid: number\n\tcode: string\n\tname: string\n\tstatus: 0 | 1\n\tdescription?: string\n\tcreatedAt?: string\n\tupdatedAt?: string\n}\n\nexport interface Create${names.pascal}Input {\n\tcode: string\n\tname: string\n\tstatus: 0 | 1\n\tdescription?: string\n}\n\nexport interface Update${names.pascal}Input extends Create${names.pascal}Input {\n\tid: number\n}\n\nexport interface ${names.pascal}Query extends ApiTableRequest {\n\tcode?: string\n\tname?: string\n\tstatus?: 0 | 1\n}\n`;
}

function renderApiIndex({ names, options }) {
	const typeImports = [
		`Create${names.pascal}Input`,
		`${names.pascal}Item`,
		`${names.pascal}Query`,
		`Update${names.pascal}Input`,
	].sort();
	return `import type { ${typeImports.join(", ")} } from "./types";\nimport { request } from "#src/utils/request";\n\nexport * from "./types";\n\nconst RESOURCE_URL = ${JSON.stringify(options.apiEndpoint)};\nconst resourceUrl = (id: ${names.pascal}Item["id"]) => [RESOURCE_URL, encodeURIComponent(String(id))].join("/");\n\nexport function fetch${names.pascal}List(data: ${names.pascal}Query) {\n\treturn request.get<ApiListResponse<${names.pascal}Item>>(RESOURCE_URL, { searchParams: data, ignoreLoading: true }).json();\n}\n\nexport function fetch${names.pascal}Detail(id: ${names.pascal}Item["id"]) {\n\treturn request.get<ApiResponse<${names.pascal}Item>>(resourceUrl(id)).json();\n}\n\nexport function create${names.pascal}(data: Create${names.pascal}Input) {\n\treturn request.post<ApiResponse<${names.pascal}Item>>(RESOURCE_URL, { json: data }).json();\n}\n\nexport function update${names.pascal}(data: Update${names.pascal}Input) {\n\treturn request.put<ApiResponse<${names.pascal}Item>>(resourceUrl(data.id), { json: data }).json();\n}\n\nexport function delete${names.pascal}(id: ${names.pascal}Item["id"]) {\n\treturn request.delete<ApiResponse<number>>(resourceUrl(id)).json();\n}\n`;
}

function renderConstants({ names, apiAlias }) {
	return `import type { ProColumns, ProDescriptionsItemProps } from "@ant-design/pro-components";\nimport type { TFunction } from "i18next";\nimport type { ${names.pascal}Item } from "${apiAlias}";\n\nexport function get${names.pascal}Columns(t: TFunction): ProColumns<${names.pascal}Item>[] {\n\treturn [\n\t\t{ title: t("${names.kebab}.table.index"), valueType: "indexBorder", width: 72, search: false },\n\t\t{ title: t("${names.kebab}.table.code"), dataIndex: "code", valueType: "text", width: 140 },\n\t\t{ title: t("${names.kebab}.table.name"), dataIndex: "name", valueType: "text", width: 220 },\n\t\t{\n\t\t\ttitle: t("${names.kebab}.table.status"),\n\t\t\tdataIndex: "status",\n\t\t\tvalueType: "select",\n\t\t\twidth: 140,\n\t\t\tvalueEnum: {\n\t\t\t\t1: { text: t("${names.kebab}.status.active"), status: "Success" },\n\t\t\t\t0: { text: t("${names.kebab}.status.inactive"), status: "Default" },\n\t\t\t},\n\t\t},\n\t\t{ title: t("${names.kebab}.table.createdAt"), dataIndex: "createdAt", valueType: "dateTime", width: 180, search: false },\n\t];\n}\n\nexport function get${names.pascal}DetailColumns(t: TFunction): ProDescriptionsItemProps<${names.pascal}Item>[] {\n\treturn [\n\t\t{ title: "ID", dataIndex: "id", valueType: "digit" },\n\t\t{ title: t("${names.kebab}.table.code"), dataIndex: "code" },\n\t\t{ title: t("${names.kebab}.table.name"), dataIndex: "name" },\n\t\t{\n\t\t\ttitle: t("${names.kebab}.table.status"),\n\t\t\tdataIndex: "status",\n\t\t\tvalueType: "select",\n\t\t\tvalueEnum: {\n\t\t\t\t1: { text: t("${names.kebab}.status.active"), status: "Success" },\n\t\t\t\t0: { text: t("${names.kebab}.status.inactive"), status: "Default" },\n\t\t\t},\n\t\t},\n\t\t{ title: t("${names.kebab}.table.description"), dataIndex: "description", valueType: "textarea" },\n\t\t{ title: t("${names.kebab}.table.createdAt"), dataIndex: "createdAt", valueType: "dateTime" },\n\t\t{ title: t("${names.kebab}.table.updatedAt"), dataIndex: "updatedAt", valueType: "dateTime" },\n\t];\n}\n`;
}

function renderFormFields(names) {
	return `<ProFormText\n\tname="code"\n\tlabel={t("${names.kebab}.form.code")}\n\trules={[{ required: true, message: t("${names.kebab}.form.codeRequired") }]}\n/>\n<ProFormText\n\tname="name"\n\tlabel={t("${names.kebab}.form.name")}\n\trules={[{ required: true, message: t("${names.kebab}.form.nameRequired") }]}\n/>\n<ProFormSelect\n\tname="status"\n\tlabel={t("${names.kebab}.form.status")}\n\trules={[{ required: true }]}\n\toptions={[\n\t\t{ label: t("${names.kebab}.status.active"), value: 1 },\n\t\t{ label: t("${names.kebab}.status.inactive"), value: 0 },\n\t]}\n/>\n<ProFormTextArea\n\tname="description"\n\tlabel={t("${names.kebab}.form.description")}\n/>`;
}

function indent(value, level) {
	const prefix = "\t".repeat(level);
	return value.split("\n").map(line => line ? `${prefix}${line}` : line).join("\n");
}

function renderCreateModal({ names, apiAlias }) {
	return `import type { Create${names.pascal}Input } from "${apiAlias}";\nimport { DrawerForm, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";\nimport { useMutation } from "@tanstack/react-query";\nimport { useTranslation } from "react-i18next";\nimport { create${names.pascal} } from "${apiAlias}";\n\ninterface Create${names.pascal}ModalProps {\n\topen: boolean\n\tonClose: () => void\n\tonSuccess: () => void\n}\n\nexport function Create${names.pascal}Modal({ open, onClose, onSuccess }: Create${names.pascal}ModalProps) {\n\tconst { t } = useTranslation();\n\tconst mutation = useMutation({ mutationFn: create${names.pascal} });\n\n\tconst onFinish = async (values: Create${names.pascal}Input) => {\n\t\tawait mutation.mutateAsync(values);\n\t\twindow.$message?.success(t("${names.kebab}.messages.createSuccess"));\n\t\tonSuccess();\n\t\treturn true;\n\t};\n\n\treturn (\n\t\t<DrawerForm<Create${names.pascal}Input>\n\t\t\ttitle={t("${names.kebab}.modals.createTitle")}\n\t\t\topen={open}\n\t\t\tinitialValues={{ status: 1 }}\n\t\t\tdrawerProps={{ destroyOnHidden: true }}\n\t\t\tresize={{ minWidth: 480, maxWidth: window.innerWidth * 0.8 }}\n\t\t\tonOpenChange={visible => !visible && onClose()}\n\t\t\tonFinish={onFinish}\n\t\t>\n${indent(renderFormFields(names), 3)}\n\t\t</DrawerForm>\n\t);\n}\n`;
}

function renderUpdateModal({ names, apiAlias }) {
	return `import type { Create${names.pascal}Input, ${names.pascal}Item } from "${apiAlias}";\nimport { DrawerForm, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";\nimport { useMutation } from "@tanstack/react-query";\nimport { Form } from "antd";\nimport { useEffect } from "react";\nimport { useTranslation } from "react-i18next";\nimport { update${names.pascal} } from "${apiAlias}";\n\ninterface Update${names.pascal}ModalProps {\n\topen: boolean\n\titem: ${names.pascal}Item | null\n\tonClose: () => void\n\tonSuccess: () => void\n}\n\nexport function Update${names.pascal}Modal({ open, item, onClose, onSuccess }: Update${names.pascal}ModalProps) {\n\tconst { t } = useTranslation();\n\tconst [form] = Form.useForm<Create${names.pascal}Input>();\n\tconst mutation = useMutation({ mutationFn: update${names.pascal} });\n\n\tuseEffect(() => {\n\t\tif (!open || !item)\n\t\t\treturn;\n\t\tform.setFieldsValue(item);\n\t}, [form, item, open]);\n\n\tconst onFinish = async (values: Create${names.pascal}Input) => {\n\t\tif (!item)\n\t\t\treturn false;\n\t\tawait mutation.mutateAsync({ ...values, id: item.id });\n\t\twindow.$message?.success(t("${names.kebab}.messages.updateSuccess"));\n\t\tonSuccess();\n\t\treturn true;\n\t};\n\n\treturn (\n\t\t<DrawerForm<Create${names.pascal}Input>\n\t\t\ttitle={t("${names.kebab}.modals.updateTitle")}\n\t\t\topen={open}\n\t\t\tform={form}\n\t\t\tdrawerProps={{ destroyOnHidden: true }}\n\t\t\tresize={{ minWidth: 480, maxWidth: window.innerWidth * 0.8 }}\n\t\t\tonOpenChange={visible => !visible && onClose()}\n\t\t\tonFinish={onFinish}\n\t\t>\n${indent(renderFormFields(names), 3)}\n\t\t</DrawerForm>\n\t);\n}\n`;
}

function renderDetailModal({ names, apiAlias }) {
	return `import type { ${names.pascal}Item } from "${apiAlias}";\nimport { ProDescriptions } from "@ant-design/pro-components";\nimport { useQuery } from "@tanstack/react-query";\nimport { Drawer, Spin } from "antd";\nimport { useTranslation } from "react-i18next";\nimport { fetch${names.pascal}Detail } from "${apiAlias}";\nimport { get${names.pascal}DetailColumns } from "../constants";\n\ninterface ${names.pascal}DetailModalProps {\n\topen: boolean\n\titemId: ${names.pascal}Item["id"] | null\n\tonClose: () => void\n}\n\nexport function ${names.pascal}DetailModal({ open, itemId, onClose }: ${names.pascal}DetailModalProps) {\n\tconst { t } = useTranslation();\n\tconst detailQuery = useQuery({\n\t\tqueryKey: ["${names.kebab}-detail", itemId],\n\t\tqueryFn: async () => {\n\t\t\tif (itemId === null)\n\t\t\t\tthrow new Error("Missing item id");\n\t\t\tconst response = await fetch${names.pascal}Detail(itemId);\n\t\t\treturn response.result;\n\t\t},\n\t\tenabled: open && itemId !== null,\n\t});\n\n\treturn (\n\t\t<Drawer\n\t\t\ttitle={t("${names.kebab}.modals.detailTitle")}\n\t\t\topen={open}\n\t\t\twidth={640}\n\t\t\tdestroyOnHidden\n\t\t\tonClose={onClose}\n\t\t>\n\t\t\t<Spin spinning={detailQuery.isFetching}>\n\t\t\t\t{detailQuery.data && (\n\t\t\t\t\t<ProDescriptions<${names.pascal}Item>\n\t\t\t\t\t\tcolumn={1}\n\t\t\t\t\t\tcolumns={get${names.pascal}DetailColumns(t)}\n\t\t\t\t\t\tdataSource={detailQuery.data}\n\t\t\t\t\t/>\n\t\t\t\t)}\n\t\t\t</Spin>\n\t\t</Drawer>\n\t);\n}\n`;
}

function renderHooks({ names, apiAlias }) {
	return `import { useMutation } from "@tanstack/react-query";\nimport { delete${names.pascal}, fetch${names.pascal}Detail } from "${apiAlias}";\n\nexport function use${names.pascal}Actions() {\n\tconst deleteMutation = useMutation({ mutationFn: delete${names.pascal} });\n\n\treturn {\n\t\tgetDetail: fetch${names.pascal}Detail,\n\t\tremove: deleteMutation.mutateAsync,\n\t\tisDeleting: deleteMutation.isPending,\n\t};\n}\n`;
}

function renderComponentsIndex({ names, options }) {
	const exports = [];
	if (!options.skipModals) {
		exports.push(`export { Create${names.pascal}Modal } from "./create-${names.kebab}-modal";`);
		exports.push(`export { Update${names.pascal}Modal } from "./update-${names.kebab}-modal";`);
	}
	if (!options.skipDetail) {
		exports.push(`export { ${names.pascal}DetailModal } from "./${names.kebab}-detail-modal";`);
	}
	return `${exports.sort().join("\n")}\n`;
}

function renderPage(context) {
	const { names, apiAlias, options } = context;
	const iconImports = ["DeleteOutlined"];
	const antdImports = ["Popconfirm"];
	const reactImports = ["useRef"];
	if (!options.skipModals)
		iconImports.push("EditOutlined", "PlusCircleOutlined");
	if (!options.skipDetail)
		iconImports.push("EyeOutlined");
	if (!options.skipModals)
		antdImports.push("Button");
	if (!options.skipModals || !options.skipDetail)
		reactImports.push("useState");
	iconImports.sort();
	antdImports.sort();
	reactImports.sort();

	const componentImports = [];
	if (!options.skipModals)
		componentImports.push(`Create${names.pascal}Modal`, `Update${names.pascal}Modal`);
	if (!options.skipDetail)
		componentImports.push(`${names.pascal}DetailModal`);
	componentImports.sort();

	const modalState = options.skipModals
		? ""
		: `\n\tconst [createOpen, setCreateOpen] = useState(false);\n\tconst [updateItem, setUpdateItem] = useState<${names.pascal}Item | null>(null);`;
	const detailState = options.skipDetail
		? ""
		: `\n\tconst [detailId, setDetailId] = useState<${names.pascal}Item["id"] | null>(null);`;
	const editHandler = options.skipModals
		? ""
		: `\n\tconst openUpdate = async (record: ${names.pascal}Item) => {\n\t\tconst response = await getDetail(record.id);\n\t\tsetUpdateItem(response.result);\n\t};\n`;
	const viewAction = options.skipDetail
		? ""
		: `\n\t\t\t\t<BasicButton key="${names.camel}-view" type="link" size="small" onClick={() => setDetailId(record.id)}>\n\t\t\t\t\t<EyeOutlined />\n\t\t\t\t\t{t("common.view")}\n\t\t\t\t</BasicButton>,`;
	const editAction = options.skipModals
		? ""
		: `\n\t\t\t\t<BasicButton\n\t\t\t\t\tkey="${names.camel}-edit"\n\t\t\t\t\ttype="link"\n\t\t\t\t\tsize="small"\n\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.update)}\n\t\t\t\t\tonClick={() => openUpdate(record)}\n\t\t\t\t>\n\t\t\t\t\t<EditOutlined />\n\t\t\t\t\t{t("common.edit")}\n\t\t\t\t</BasicButton>,`;
	const toolbar = options.skipModals
		? ""
		: `\n\t\t\t\ttoolBarRender={() => [\n\t\t\t\t\t<Button\n\t\t\t\t\t\tkey="${names.camel}-create"\n\t\t\t\t\t\ttype="primary"\n\t\t\t\t\t\ticon={<PlusCircleOutlined />}\n\t\t\t\t\t\tdisabled={!hasAccessByCodes(accessControlCodes.add)}\n\t\t\t\t\t\tonClick={() => setCreateOpen(true)}\n\t\t\t\t\t>\n\t\t\t\t\t\t{t("common.add")}\n\t\t\t\t\t</Button>,\n\t\t\t\t]}`;
	const modalMarkup = options.skipModals
		? ""
		: `\n\t\t\t<Create${names.pascal}Modal\n\t\t\t\topen={createOpen}\n\t\t\t\tonClose={() => setCreateOpen(false)}\n\t\t\t\tonSuccess={() => {\n\t\t\t\t\tsetCreateOpen(false);\n\t\t\t\t\tactionRef.current?.reload();\n\t\t\t\t}}\n\t\t\t/>\n\t\t\t<Update${names.pascal}Modal\n\t\t\t\topen={updateItem !== null}\n\t\t\t\titem={updateItem}\n\t\t\t\tonClose={() => setUpdateItem(null)}\n\t\t\t\tonSuccess={() => {\n\t\t\t\t\tsetUpdateItem(null);\n\t\t\t\t\tactionRef.current?.reload();\n\t\t\t\t}}\n\t\t\t/>`;
	const detailMarkup = options.skipDetail
		? ""
		: `\n\t\t\t<${names.pascal}DetailModal\n\t\t\t\topen={detailId !== null}\n\t\t\t\titemId={detailId}\n\t\t\t\tonClose={() => setDetailId(null)}\n\t\t\t/>`;

	const actionImports = options.skipModals ? "remove" : "getDetail, remove";
	const pageTemplate = `import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";\nimport type { ${names.pascal}Item, ${names.pascal}Query } from "${apiAlias}";\n\nimport { ${iconImports.join(", ")} } from "@ant-design/icons";\nimport { ${antdImports.join(", ")} } from "antd";\nimport { ${reactImports.join(", ")} } from "react";\nimport { useTranslation } from "react-i18next";\nimport { fetch${names.pascal}List } from "${apiAlias}";\nimport { BasicButton } from "#src/components/basic-button";\nimport { BasicContent } from "#src/components/basic-content";\nimport { BasicTable } from "#src/components/basic-table";\nimport { accessControlCodes, useAccess } from "#src/hooks/use-access";\n\n${componentImports.length > 0 ? `import { ${componentImports.join(", ")} } from "./components";\n` : ""}import { get${names.pascal}Columns } from "./constants";\nimport { use${names.pascal}Actions } from "./hooks/use-${names.kebab}";\n\nexport default function ${names.pascal}Page() {\n\tconst { t } = useTranslation();\n\tconst { hasAccessByCodes } = useAccess();\n\tconst { ${actionImports} } = use${names.pascal}Actions();\n\tconst actionRef = useRef<ActionType>(null);${modalState}${detailState}${editHandler}\n\tconst handleDelete = async (record: ${names.pascal}Item, action?: ProCoreActionType<object>) => {\n\t\tawait remove(record.id);\n\t\twindow.$message?.success(t("${names.kebab}.messages.deleteSuccess"));\n\t\tawait action?.reload?.();\n\t};\n\n\tconst columns: ProColumns<${names.pascal}Item>[] = [\n\t\t...get${names.pascal}Columns(t),\n\t\t{\n\t\t\ttitle: t("common.action"),\n\t\t\tvalueType: "option",\n\t\t\tkey: "actions",\n\t\t\tsearch: false,\n\t\t\tfixed: "right",\n\t\t\twidth: 220,\n\t\t\trender: (_, record, __, action) => [${viewAction}${editAction}\n\t\t\t\t<Popconfirm\n\t\t\t\t\tkey="delete"\n\t\t\t\t\ttitle={t("common.confirmDelete")}\n\t\t\t\t\tokText={t("common.confirm")}\n\t\t\t\t\tcancelText={t("common.cancel")}\n\t\t\t\t\tonConfirm={() => handleDelete(record, action)}\n\t\t\t\t>\n\t\t\t\t\t<BasicButton type="link" size="small" disabled={!hasAccessByCodes(accessControlCodes.delete)}>\n\t\t\t\t\t\t<DeleteOutlined />\n\t\t\t\t\t\t{t("common.delete")}\n\t\t\t\t\t</BasicButton>\n\t\t\t\t</Popconfirm>,\n\t\t\t],\n\t\t},\n\t];\n\n\treturn (\n\t\t<BasicContent className="h-full">\n\t\t\t<BasicTable<${names.pascal}Item, ${names.pascal}Query>\n\t\t\t\tadaptive\n\t\t\t\tactionRef={actionRef}\n\t\t\t\tcolumns={columns}\n\t\t\t\tcolumnsState={{ persistenceKey: "${context.moduleName}-${names.kebab}-columns", persistenceType: "localStorage" }}\n\t\t\t\theaderTitle={t("${names.kebab}.title")}\n\t\t\t\tsearch={{ defaultCollapsed: false, labelWidth: "auto" }}\n\t\t\t\trequest={async (params) => {\n\t\t\t\t\tconst response = await fetch${names.pascal}List(params);\n\t\t\t\t\treturn { data: response.result.list, total: response.result.total, success: response.success };\n\t\t\t\t}}${toolbar}\n\t\t\t/>${modalMarkup}${detailMarkup}\n\t\t</BasicContent>\n\t);\n}\n`;
	return pageTemplate;
}

function renderRoute({ names, options, pageRelativePath, routePath }) {
	return `import type { AppRouteRecordRaw } from "#src/router/types";\nimport { ${options.menuIcon} } from "@ant-design/icons";\nimport { createElement, lazy } from "react";\nimport ContainerLayout from "#src/layout/container-layout";\n\nconst ${names.pascal}Page = lazy(() => import("#${pageRelativePath}"));\n\nconst routes: AppRouteRecordRaw[] = [\n\t{\n\t\tpath: "${routePath}",\n\t\tComponent: ContainerLayout,\n\t\thandle: {\n\t\t\ticon: createElement(${options.menuIcon}),\n\t\t\torder: 200,\n\t\t\ttitle: "${names.kebab}.title",\n\t\t},\n\t\tchildren: [\n\t\t\t{\n\t\t\t\tindex: true,\n\t\t\t\tComponent: ${names.pascal}Page,\n\t\t\t\thandle: {\n\t\t\t\t\ttitle: "${names.kebab}.title",\n\t\t\t\t\tpermissions: [\n\t\t\t\t\t\t"permission:button:add",\n\t\t\t\t\t\t"permission:button:update",\n\t\t\t\t\t\t"permission:button:delete",\n\t\t\t\t\t],\n\t\t\t\t},\n\t\t\t},\n\t\t],\n\t},\n];\n\nexport default routes;\n`;
}

function localeContent(context, language) {
	const { names } = context;
	const isVietnamese = language === "vi-VN";
	return `${JSON.stringify({
		title: isVietnamese ? names.title : names.titleEn,
		table: {
			index: isVietnamese ? "STT" : "#",
			code: isVietnamese ? "Mã" : "Code",
			name: isVietnamese ? "Tên" : "Name",
			status: isVietnamese ? "Trạng thái" : "Status",
			description: isVietnamese ? "Mô tả" : "Description",
			createdAt: isVietnamese ? "Ngày tạo" : "Created at",
			updatedAt: isVietnamese ? "Ngày cập nhật" : "Updated at",
		},
		form: {
			code: isVietnamese ? "Mã" : "Code",
			codeRequired: isVietnamese ? "Vui lòng nhập mã" : "Please enter code",
			name: isVietnamese ? "Tên" : "Name",
			nameRequired: isVietnamese ? "Vui lòng nhập tên" : "Please enter name",
			status: isVietnamese ? "Trạng thái" : "Status",
			description: isVietnamese ? "Mô tả" : "Description",
		},
		status: {
			active: isVietnamese ? "Hoạt động" : "Active",
			inactive: isVietnamese ? "Ngừng hoạt động" : "Inactive",
		},
		modals: {
			createTitle: `${isVietnamese ? "Thêm mới" : "Create"} ${isVietnamese ? names.title : names.titleEn}`,
			updateTitle: `${isVietnamese ? "Cập nhật" : "Update"} ${isVietnamese ? names.title : names.titleEn}`,
			detailTitle: `${isVietnamese ? "Chi tiết" : "Details"} ${isVietnamese ? names.title : names.titleEn}`,
		},
		messages: {
			createSuccess: isVietnamese ? "Thêm mới thành công" : "Created successfully",
			updateSuccess: isVietnamese ? "Cập nhật thành công" : "Updated successfully",
			deleteSuccess: isVietnamese ? "Xóa thành công" : "Deleted successfully",
		},
	}, null, "\t")}\n`;
}

function buildFiles(context) {
	const { names, options, pageRelativePath, apiRelativePath, moduleName } = context;
	const files = [];

	if (!options.skipApi) {
		files.push({ relativePath: `${apiRelativePath}/types.ts`, content: renderApiTypes(context) });
		files.push({ relativePath: `${apiRelativePath}/index.ts`, content: renderApiIndex(context) });
	}

	files.push({ relativePath: `${pageRelativePath}/constants.ts`, content: renderConstants(context) });
	files.push({ relativePath: `${pageRelativePath}/hooks/use-${names.kebab}.ts`, content: renderHooks(context) });
	if (!options.skipModals) {
		files.push({ relativePath: `${pageRelativePath}/components/create-${names.kebab}-modal.tsx`, content: renderCreateModal(context) });
		files.push({ relativePath: `${pageRelativePath}/components/update-${names.kebab}-modal.tsx`, content: renderUpdateModal(context) });
	}
	if (!options.skipDetail) {
		files.push({ relativePath: `${pageRelativePath}/components/${names.kebab}-detail-modal.tsx`, content: renderDetailModal(context) });
	}
	if (!options.skipModals || !options.skipDetail) {
		files.push({ relativePath: `${pageRelativePath}/components/index.ts`, content: renderComponentsIndex(context) });
	}
	files.push({ relativePath: `${pageRelativePath}/index.tsx`, content: renderPage(context) });
	const routeFileName = options.folder ? `${moduleName}-${names.kebab}` : names.kebab;
	files.push({ relativePath: `src/router/routes/modules/${routeFileName}.ts`, content: renderRoute(context) });
	files.push({ relativePath: `src/locales/vi-VN/${names.kebab}.json`, content: localeContent(context, "vi-VN") });
	files.push({ relativePath: `src/locales/en-US/${names.kebab}.json`, content: localeContent(context, "en-US") });

	return files.map(file => ({
		...file,
		absolutePath: path.resolve(projectRoot, file.relativePath),
	}));
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

async function writeFiles(files, options) {
	const existingFiles = [];
	for (const file of files) {
		if (await fileExists(file.absolutePath))
			existingFiles.push(file.relativePath);
	}

	if (existingFiles.length > 0 && !options.force) {
		throw new Error(`Các file sau đã tồn tại:\n- ${existingFiles.join("\n- ")}\nDùng --force để ghi đè.`);
	}
	if (options.dryRun)
		return;

	for (const file of files) {
		if (!file.absolutePath.startsWith(`${projectRoot}${path.sep}`)) {
			throw new Error(`Đường dẫn output không an toàn: ${file.relativePath}`);
		}
		await mkdir(path.dirname(file.absolutePath), { recursive: true });
		await writeFile(file.absolutePath, file.content, "utf8");
	}
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const featureSpec = buildFeatureSpec(options);
	const files = buildFiles(featureSpec);
	console.log(`\n🚀 Generating feature: ${featureSpec.names.pascal}`);
	console.log(`   📁 Page: ${featureSpec.pageRelativePath}/`);
	if (!options.skipApi)
		console.log(`   📁 API: ${featureSpec.apiRelativePath}/`);

	await writeFiles(files, options);
	for (const file of files) {
		console.log(`   ${options.dryRun ? "•" : "✅"} ${file.relativePath}`);
	}

	console.log(options.dryRun
		? "\n🔎 Dry run hoàn tất, chưa có file nào được ghi."
		: `\n✨ Feature "${featureSpec.names.pascal}" đã được tạo thành công!`);
	if (options.folder) {
		console.log(`   ℹ️ Route độc lập được tạo tại ${featureSpec.routePath}; có thể chuyển child route vào module ${options.folder} nếu muốn dùng chung menu cha.`);
	}
}

main().catch((error) => {
	console.error(`\n❌ ${error.message}`);
	printHelp();
	process.exitCode = 1;
});
