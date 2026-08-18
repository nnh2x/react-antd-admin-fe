import type { ParamsType, ProColumns, ProTable, ProTableProps } from "@ant-design/pro-components";

import type { TablePaginationConfig } from "antd";
import type { ThHTMLAttributes } from "react";

import { LoadingOutlined } from "@ant-design/icons";
import { DragSortTable } from "@ant-design/pro-components";
import { useDebounceFn, useSize } from "ahooks";
import { Input } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { footerHeight as layoutFooterHeight } from "#src/layout/constants";
import { usePreferencesStore } from "#src/store/preferences";
import { cn } from "#src/utils/cn";
import { isObject, isUndefined } from "#src/utils/is";

import { BASIC_TABLE_ROOT_CLASS_NAME } from "./constants";
import { useStyles } from "./styles";

const Table = DragSortTable as typeof ProTable;

/** Minimum width (px) a column can be resized down to. */
const MIN_COLUMN_WIDTH = 60;

export interface BasicTableHeaderSearchConfig {
	/** Input placeholder. Defaults to the `common.search` translation. */
	placeholder?: string
	/** Debounce delay (ms) before the value is committed and merged into the request params. Default `400`. */
	debounce?: number
	/** Render a custom search control instead of the default `Input`. */
	render?: (value: string, onChange: (value: string) => void) => React.ReactNode
}

export type BasicTableColumn<D, V = "text"> = ProColumns<D, V> & {
	/**
	 * Render a search input under this column's header title. The captured value is merged into the
	 * table's request `params` (keyed by the column's `key`/`dataIndex`), so it reaches your `request` call.
	 *
	 * This is independent from ProTable's built-in `search` field, which controls the collapsible search
	 * form rendered above the table.
	 */
	headerSearch?: boolean | BasicTableHeaderSearchConfig
	/** Whether this column's width can be dragged to resize. Falls back to the table-level `resizable` prop. */
	resizable?: boolean
};

export interface BasicTableProps<D, U, V = "text"> extends Omit<ProTableProps<D, U, V>, "columns"> {
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
	/**
	 * Table-wide switch for column width resizing (drag the column border).
	 * Can be disabled per-column via `column.resizable`.
	 * @default true
	 */
	resizable?: boolean
	columns?: BasicTableColumn<D, V>[]
	/**
	 * Called whenever any column's header search value changes, with the full map of active values
	 * keyed by column `key`/`dataIndex`. These values are also merged into the table's request `params`.
	 */
	onHeaderSearchChange?: (values: Record<string, string>) => void
}

function getColumnKey(column: BasicTableColumn<any, any>): string {
	if (!isUndefined(column.key)) {
		return String(column.key);
	}
	if (Array.isArray(column.dataIndex)) {
		return column.dataIndex.join(".");
	}
	if (!isUndefined(column.dataIndex)) {
		return String(column.dataIndex);
	}
	return "";
}

interface ResizableTitleProps extends ThHTMLAttributes<HTMLTableCellElement> {
	width?: number
	resizable?: boolean
	onResize?: (width: number) => void
}

/** Header `<th>` replacement that adds a drag handle on its right edge to resize the column. */
function ResizableTitle(props: ResizableTitleProps) {
	const { width, resizable, onResize, style, className, children, ...restProps } = props;
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const [dragging, setDragging] = useState(false);

	const handleMouseMove = useCallback((event: MouseEvent) => {
		const delta = event.clientX - startXRef.current;
		onResize?.(Math.max(startWidthRef.current + delta, MIN_COLUMN_WIDTH));
	}, [onResize]);

	const handleMouseUp = useCallback(() => {
		setDragging(false);
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseMove]);

	useEffect(() => () => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseMove, handleMouseUp]);

	if (!resizable || !width) {
		return <th className={className} style={style} {...restProps}>{children}</th>;
	}

	const handleMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		event.preventDefault();
		startXRef.current = event.clientX;
		startWidthRef.current = width;
		setDragging(true);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	};

	return (
		<th className={cn(className, "relative")} style={style} {...restProps}>
			{children}
			<span
				className={cn(
					"absolute inset-y-0 right-0 z-10 w-2 -mr-1 cursor-col-resize touch-none select-none",
					dragging && "bg-gray-400/60 dark:bg-gray-300/40",
				)}
				onMouseDown={handleMouseDown}
				onClick={event => event.stopPropagation()}
			/>
		</th>
	);
}

interface HeaderSearchInputProps {
	value?: string
	config?: BasicTableHeaderSearchConfig
	placeholder: string
	onChange: (value: string | undefined) => void
}

/** Debounced search input rendered under a column's header title. */
function HeaderSearchInput(props: HeaderSearchInputProps) {
	const { value, config, placeholder, onChange } = props;
	const [prevValue, setPrevValue] = useState(value);
	const [innerValue, setInnerValue] = useState(value ?? "");

	// Reset the local draft when the external value changes (e.g. cleared elsewhere), without an effect.
	if (value !== prevValue) {
		setPrevValue(value);
		setInnerValue(value ?? "");
	}

	const { run: commitChange } = useDebounceFn(
		(nextValue: string) => onChange(nextValue || undefined),
		{ wait: config?.debounce ?? 400 },
	);

	const handleChange = (nextValue: string) => {
		setInnerValue(nextValue);
		commitChange(nextValue);
	};

	if (config?.render) {
		return config.render(innerValue, handleChange);
	}

	return (
		<Input
			size="small"
			allowClear
			value={innerValue}
			placeholder={config?.placeholder ?? placeholder}
			onClick={event => event.stopPropagation()}
			onChange={event => handleChange(event.target.value)}
		/>
	);
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
	const { adaptive, resizable = true, onHeaderSearchChange } = props;
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
	/** User-adjusted column widths, keyed by column `key`/`dataIndex`. */
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
	/** Active per-column header search values, keyed by column `key`/`dataIndex`. */
	const [headerSearchValues, setHeaderSearchValues] = useState<Record<string, string>>({});

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

	const handleHeaderSearchChange = useCallback((key: string, value: string | undefined) => {
		setHeaderSearchValues((prev) => {
			if (isUndefined(value) || value === "") {
				if (!(key in prev))
					return prev;
				const next = { ...prev };
				delete next[key];
				return next;
			}
			if (prev[key] === value)
				return prev;
			return { ...prev, [key]: value };
		});
	}, []);

	useEffect(() => {
		onHeaderSearchChange?.(headerSearchValues);
	}, [headerSearchValues, onHeaderSearchChange]);

	/** Recursively merges resize + header-search behavior into the caller's columns. */
	const mergeColumns = useCallback((columns: BasicTableColumn<DataType, ValueType>[]): ProColumns<DataType, ValueType>[] => {
		return columns.map((column) => {
			const children = column.children
				? mergeColumns(column.children as BasicTableColumn<DataType, ValueType>[])
				: undefined;

			const key = getColumnKey(column);
			if (!key) {
				return { ...column, children } as ProColumns<DataType, ValueType>;
			}

			const columnResizable = resizable && column.resizable !== false;
			const width = columnWidths[key] ?? column.width;
			const originalTitle = column.title;

			const nextColumn = {
				...column,
				children,
				width,
				onHeaderCell: (col: any) => ({
					...column.onHeaderCell?.(col),
					width,
					resizable: columnResizable,
					onResize: (nextWidth: number) => {
						setColumnWidths(prev => ({ ...prev, [key]: nextWidth }));
					},
				}),
			} as ProColumns<DataType, ValueType>;

			if (column.headerSearch) {
				const searchConfig = isObject(column.headerSearch) ? column.headerSearch : undefined;
				nextColumn.title = ((...args: any[]) => {
					const titleNode = typeof originalTitle === "function" ? (originalTitle as (...args: any[]) => React.ReactNode)(...args) : originalTitle;
					return (
						<div className="flex flex-col gap-1">
							<div>{titleNode}</div>
							<HeaderSearchInput
								value={headerSearchValues[key]}
								config={searchConfig}
								placeholder={t("common.search")}
								onChange={value => handleHeaderSearchChange(key, value)}
							/>
						</div>
					);
				}) as typeof nextColumn.title;
			}

			return nextColumn;
		});
	}, [resizable, columnWidths, headerSearchValues, t, handleHeaderSearchChange]);

	const mergedColumns = useMemo(
		() => (props.columns ? mergeColumns(props.columns) : props.columns),
		[props.columns, mergeColumns],
	);

	const mergedComponents = useMemo(() => ({
		...props.components,
		header: {
			...props.components?.header,
			cell: ResizableTitle,
		},
	}), [props.components]);

	const mergedParams = useMemo(
		() => ({ ...props.params, ...headerSearchValues }) as Params,
		[props.params, headerSearchValues],
	);

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
				columns={mergedColumns}
				components={mergedComponents}
				params={mergedParams}
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
