import type { ParamsType, ProTable, ProTableProps } from "@ant-design/pro-components";

import type { TablePaginationConfig } from "antd";

import { LoadingOutlined } from "@ant-design/icons";
import { DragSortTable } from "@ant-design/pro-components";
import { useSize } from "ahooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { footerHeight as layoutFooterHeight } from "#src/layout/constants";
import { usePreferencesStore } from "#src/store/preferences";
import { cn } from "#src/utils/cn";
import { isObject, isUndefined } from "#src/utils/is";

import { BASIC_TABLE_ROOT_CLASS_NAME } from "./constants";
import { useStyles } from "./styles";

const Table = DragSortTable as typeof ProTable;

export interface BasicTableProps<D, U, V> extends ProTableProps<D, U, V> {
	/**
	 * @description Adapt to the content area height. If scroll.y is set, this adaptation is skipped
	 * @default false
	 */
	adaptive?: boolean | {
		/** Offset between the table and the bottom of the page, default value is `16` */
		offsetBottom?: number
	}
	/** Column key containing the row drag handle. */
	dragSortKey?: string
	/** Called with the reordered data after a row is dropped. */
	onDragSortEnd?: (beforeIndex: number, afterIndex: number, dataSource: D[]) => Promise<void> | void
}

export function BasicTable<
	DataType extends Record<string, any>,
	Params extends ParamsType = ParamsType,
	ValueType = "text",
>(
	props: BasicTableProps<DataType, Params, ValueType>,
) {
	const classes = useStyles();
	const { t } = useTranslation();
	const { adaptive } = props;
	const tableWrapperRef = useRef<HTMLDivElement>(null);
	const size = useSize(tableWrapperRef);
	const {
		enableFooter,
		fixedFooter,
	} = usePreferencesStore();
	/**
	 * @description Why scrollY is set to initial in a dynamic table
	 * @see https://gist.github.com/condorheroblog/557c18c61084a1296b716bcb1203315e
	 */
	const [scrollY, setScrollY] = useState<number | string | undefined>(adaptive ? "initial" : undefined);

	/**
	 * @description Fixed footer height
	 * If the footer is enabled and fixed, return the footer height, otherwise return 0
	 */
	const footerHeight = useMemo(() => {
		if (enableFooter && fixedFooter) {
			return layoutFooterHeight;
		}
		return 0;
	}, [enableFooter, fixedFooter]);

	const getPaginationProps = useCallback(() => {
		if (props.pagination === false) {
			return false;
		}

		return {
			placement: ["bottomStart"],
			defaultPageSize: 10,
			showQuickJumper: true,
			showSizeChanger: true,
			showTotal: total => t("common.pagination", { total }),
			...props.pagination,
		} satisfies TablePaginationConfig;
	}, [props.pagination, t]);

	/**
	 * @description Calculate the pagination height
	 * If pagination is disabled, return 0, otherwise return the corresponding height based on the pagination size
	 *
	 *
	 * The pagination height cannot be calculated by reading the DOM, because pagination is a child component and the parent cannot access it before it has loaded
	 */
	const paginationHeight = useMemo(() => {
		const paginationProps = getPaginationProps();
		const isPaginationDisabled = paginationProps === false;
		if (isPaginationDisabled) {
			return 0;
		}
		else {
			if (!paginationProps.size) {
				// Default pagination height is 32px
				return 32 + 16 + 16;
			}
			else {
				// Small pagination height is 24px
				return 24 + 16 + 16;
			}
		}
	}, [getPaginationProps]);

	/**
	 * @description Table height adaptation
	 * This is a workaround hook, waiting for antd to fix it
	 * @see https://github.com/ant-design/ant-design/issues/23974
	 */
	useEffect(() => {
		if (!isUndefined(props.scroll?.y)) {
			// If scroll.y has already been set, skip height adaptation
			return;
		}

		if (adaptive && tableWrapperRef.current && size?.height) {
			const basicTable = tableWrapperRef.current.getElementsByClassName(BASIC_TABLE_ROOT_CLASS_NAME)[0];

			if (!basicTable)
				return;

			const tableWrapperRect = tableWrapperRef.current.getBoundingClientRect();

			// If the table is off-screen, skip height adaptation
			if (tableWrapperRect.top > window.innerHeight) {
				return;
			}

			const tableBody = basicTable.querySelector("div.ant-table-body");

			if (!tableBody)
				return;

			// Get the bounding rect of the element
			const tableBodyRect = tableBody.getBoundingClientRect();

			// 16 is the padding value of BasicContent
			const offsetBottom = isObject(adaptive) ? (adaptive.offsetBottom ?? 16) : 16;

			const realOffsetBottom = offsetBottom + paginationHeight + footerHeight;

			const bodyHeight = window.innerHeight - tableBodyRect.top - realOffsetBottom;
			/**
			 * scroll.y sets the max-height, so we need to set the height manually
			 */
			tableBody.setAttribute("style", `overflow-y: auto;min-height: ${bodyHeight}px;max-height: ${bodyHeight}px;`);
			setScrollY(bodyHeight);
		}
	}, [size, adaptive, paginationHeight, footerHeight, props.scroll?.y]);

	const getLoadingProps = () => {
		if (props.loading === false) {
			return false;
		}
		if (props.loading === true) {
			return true;
		}
		return {
			indicator: <LoadingOutlined spin />,
			...props.loading,
		};
	};

	return (
		<div className="h-full" ref={tableWrapperRef}>
			<Table<DataType, Params, ValueType>
				cardBordered
				rowKey="id"
				dateFormatter="string"
				{...props}
				options={{
					fullScreen: true,
					...props.options,
				}}
				rootClassName={cn(BASIC_TABLE_ROOT_CLASS_NAME, props.rootClassName)}
				className={cn(classes.basicTable, props.className)}
				scroll={{ y: scrollY, x: "max-content", ...props.scroll }}
				loading={getLoadingProps()}
				pagination={getPaginationProps()}
				expandable={{
					// expandIcon: ({ expanded, onExpand, record }) => {
					// 	return expanded
					// 		? (
					// 			<RightOutlined onClick={e => onExpand(record, e)} />
					// 		)
					// 		: (
					// 			<DownOutlined onClick={e => onExpand(record, e)} />
					// 		);
					// },
					...props.expandable,
				}}
			/>
		</div>
	);
}
