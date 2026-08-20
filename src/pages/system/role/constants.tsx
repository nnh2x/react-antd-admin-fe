import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";
import type { RoleItemType } from "#src/api/system/role";

import { Tag } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): ProColumns<RoleItemType>[] {
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
		},
		{
			title: t("common.remark"),
			dataIndex: "remark",
			width: 220,
			ellipsis: true,
			search: false,
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
