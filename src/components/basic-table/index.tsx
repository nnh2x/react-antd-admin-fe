import type { ParamsType, ProColumns, ProTable, ProTableProps } from "@ant-design/pro-components";

import type { TablePaginationConfig } from "antd";
import type { ThHTMLAttributes } from "react";
import type { ResizeCallbackData } from "react-resizable";

import { LoadingOutlined } from "@ant-design/icons";
import { DragSortTable } from "@ant-design/pro-components";
import { useDebounceFn, useSize } from "ahooks";
import { Input } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { Resizable } from "react-resizable";
import { useLocation } from "react-router";
import { footerHeight as layoutFooterHeight } from "#src/layout/constants";
import { usePreferencesStore } from "#src/store/preferences";
import { cn } from "#src/utils/cn";
import { isObject, isUndefined } from "#src/utils/is";

import { BASIC_TABLE_ROOT_CLASS_NAME } from "./constants";
import { useStyles } from "./styles";

const Table = DragSortTable as typeof ProTable;

/** Minimum width (px) a column can be resized down to. */
const MIN_COLUMN_WIDTH = 60;
/** Width (px) given to a resizable column that doesn't declare its own `width`. */
const DEFAULT_COLUMN_WIDTH = 150;
/** localStorage/sessionStorage key prefix for auto-persisted column widths, namespaced per route. */
const WIDTHS_STORAGE_PREFIX = "basic-table-widths:";

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

/**
 * Header `<th>` replacement that wraps the cell in `react-resizable`'s `Resizable` so its right
 * edge can be dragged to resize the column. `width` must be a concrete number for this to attach
 * (see `DEFAULT_COLUMN_WIDTH` in `mergeColumns`, which guarantees one for every resizable column).
 */
function ResizableTitle(props: ResizableTitleProps) {
	const { width, resizable, onResize, className, ...restProps } = props;
	const [dragging, setDragging] = useState(false);
	// Offset (px) of the live drag position from the column's committed width, used only to move
	// the ghost line — never fed back into React state mid-drag (see handleResizeStop for why).
	const [liveOffset, setLiveOffset] = useState(0);
	const latestWidthRef = useRef<number>(width ?? MIN_COLUMN_WIDTH);

	if (!resizable || !width) {
		return <th className={className} {...restProps} />;
	}

	// Every column's width lives in the parent's `columnWidths` state, so committing on each
	// `onResize` tick would re-render (and, several layers down, remount) the whole header row on
	// every pixel of mouse movement — which tears down the in-flight drag after the very first
	// tick. Instead only the ghost line (local state, contained to this cell) tracks the live
	// drag; the real width is committed once, in `handleResizeStop`.
	const handleResize = (_event: React.SyntheticEvent, data: ResizeCallbackData) => {
		const nextWidth = Math.round(data.size.width);
		latestWidthRef.current = nextWidth;
		setLiveOffset(nextWidth - width);
	};

	const handleResizeStop = () => {
		setDragging(false);
		setLiveOffset(0);
		if (latestWidthRef.current !== width) {
			onResize?.(latestWidthRef.current);
		}
	};

	return (
		<Resizable
			width={width}
			height={0}
			axis="x"
			resizeHandles={["e"]}
			minConstraints={[MIN_COLUMN_WIDTH, 0]}
			draggableOpts={{ enableUserSelectHack: false }}
			onResizeStart={() => {
				latestWidthRef.current = width;
				setDragging(true);
			}}
			onResizeStop={handleResizeStop}
			onResize={handleResize}
			handle={(_handleAxis, ref) => (
				<span
					ref={ref}
					// Hit target is wider than the visible line (20px, centered on the border) so it's
					// easy to land the cursor on; the thin bar inside only lights up on hover/drag so
					// hovering near the border gives immediate visual confirmation you're over it.
					className="group absolute inset-y-0 -right-2.5 z-30 w-5 cursor-col-resize touch-none select-none"
					onClick={event => event.stopPropagation()}
				>
					<span
						style={dragging ? { transform: `translateX(${liveOffset}px)` } : undefined}
						className={cn(
							"absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-transparent transition-colors",
							"group-hover:bg-blue-400/70 dark:group-hover:bg-blue-300/60",
							dragging && "bg-blue-500 dark:bg-blue-400",
						)}
					/>
				</span>
			)}
		>
			<th className={cn(className, "relative")} {...restProps} />
		</Resizable>
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
	const location = useLocation();
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
	// Resized widths auto-persist per screen — keyed by the current route by default, so every page
	// keeps its own widths without needing any config. Pass `columnsState.persistenceKey` (already
	// used to persist show/hide/order) to pin the key explicitly instead, e.g. for multiple tables
	// on one route.
	const widthsStorageKey = `${WIDTHS_STORAGE_PREFIX}${props.columnsState?.persistenceKey ?? location.pathname}`;
	const widthsStorage = props.columnsState?.persistenceType === "sessionStorage" ? sessionStorage : localStorage;
	/** User-adjusted column widths, keyed by column `key`/`dataIndex`. */
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
		try {
			const raw = widthsStorage.getItem(widthsStorageKey);
			return raw ? JSON.parse(raw) : {};
		}
		catch {
			return {};
		}
	});

	useEffect(() => {
		try {
			widthsStorage.setItem(widthsStorageKey, JSON.stringify(columnWidths));
		}
		catch {
			// Storage full or unavailable (e.g. private browsing) — resizing still works, it just won't persist.
		}
	}, [columnWidths, widthsStorageKey, widthsStorage]);
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

	// Memoized for the same reason as `loadingProps` below: a fresh object on every render (even
	// with identical content) was enough to make antd/rc-table treat the header row as changed and
	// remount it.
	const paginationProps = useMemo(() => {
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
	}, [paginationProps]);

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

	// Memoized so the `loading` prop we hand to `<Table>` keeps a stable reference across renders
	// that don't actually change `props.loading` (a fresh object here on every render was enough to
	// make antd/rc-table treat the whole header row as changed and remount it).
	const loadingProps = useMemo(() => {
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
	}, [props.loading]);

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

	// Read via ref (not the `mergeColumns` dependency array) inside the title closure below, so
	// typing in a header-search box doesn't force every column to be rebuilt on each debounced
	// commit — antd/rc-table remounts the whole header row whenever the `columns` array it's given
	// changes identity, which would otherwise blow away input focus after every commit.
	const headerSearchValuesRef = useRef(headerSearchValues);
	headerSearchValuesRef.current = headerSearchValues;

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
			// Resizing needs a concrete pixel width to drag from, so resizable columns that don't
			// declare one fall back to a default instead of staying content-sized.
			const width = columnWidths[key] ?? column.width ?? (columnResizable ? DEFAULT_COLUMN_WIDTH : undefined);
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
						// The resize handle is an absolutely-positioned strip pinned to this cell's right
						// edge (see ResizableTitle) — without this gutter, a full-width search input/select
						// sits flush against that edge and swallows the drag before it reaches the handle.
						<div className={cn("flex flex-col gap-1", columnResizable && "pr-5")}>
							<div>{titleNode}</div>
							<HeaderSearchInput
								value={headerSearchValuesRef.current[key]}
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
	}, [resizable, columnWidths, t, handleHeaderSearchChange]);

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
				tableLayout="fixed"
				{...props}
				options={{
					fullScreen: true,
					...props.options,
				}}
				rootClassName={cn(BASIC_TABLE_ROOT_CLASS_NAME, props.rootClassName)}
				className={cn(classes.basicTable, props.className)}
				scroll={{ y: scrollY, x: "max-content", ...props.scroll }}
				loading={loadingProps}
				pagination={paginationProps}
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
