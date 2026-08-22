import type { TFunction } from "i18next";
import type { BasicTableColumn } from "#src/components/basic-table";
import type { RoleItemType } from "#src/domain/system/role";

import { Select, Tag } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): BasicTableColumn<RoleItemType>[] {
	return [
		{
			dataIndex: "index",
			title: t("common.index"),
			valueType: "indexBorder",
			width: 80,
		},
		{
			title: t("system.role.name"),
			dataIndex: "name",
			ellipsis: true,
			headerSearch: true,
			formItemProps: {
				rules: [
					{
						required: true,
						message: t("form.required"),
					},
				],
			},
		},
		{
			title: t("system.role.id"),
			dataIndex: "code",
			width: 120,
			filters: true,
			onFilter: true,
			ellipsis: true,
			headerSearch: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			search: true,
			width: 80,
			render: (text, record) => {
				return <Tag color={record.status === 1 ? "success" : "default"}>{text}</Tag>;
			},
			valueEnum: {
				1: {
					text: t("common.enabled"),
				},
				0: {
					text: t("common.deactivated"),
				},
			},
			headerSearch: {
				render: (value, onChange) => (
					<Select
						size="small"
						allowClear
						value={value || undefined}
						placeholder={t("common.search")}
						onClick={event => event.stopPropagation()}
						onChange={next => onChange(next ?? "")}
						options={[
							{ label: t("common.enabled"), value: "1" },
							{ label: t("common.deactivated"), value: "0" },
						]}
					/>
				),
			},
		},
		{
			title: t("common.remark"),
			dataIndex: "remark",
			width: 220,
			ellipsis: true,
			search: false,
			headerSearch: true,
		},
		{
			title: t("common.createTime"),
			dataIndex: "createTime",
			valueType: "date",
			width: 220,
			ellipsis: true,
			search: false,
		},
		{
			title: t("common.updateTime"),
			dataIndex: "updateTime",
			valueType: "dateTime",
			width: 170,
			search: false,
		},
	];
}
