import {
	type ColumnDef,
	type ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterPlaceholder?: string;
	onRowClick?: (row: TData) => void;
	enableRowSelection?: boolean;
	onSelectionChange?: (rows: TData[]) => void;
	noun?: string;
	renderSubComponent?: (props: { row: TData }) => React.ReactNode;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filterPlaceholder = "Filter…",
	onRowClick,
	enableRowSelection = false,
	onSelectionChange,
	noun = "rows",
	renderSubComponent,
	extraToolbarAction,
}: DataTableProps<TData, TValue> & { extraToolbarAction?: React.ReactNode }) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const selectColumn: ColumnDef<TData, TValue> = {
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				onClick={(e) => e.stopPropagation()}
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 40,
	};

	const allColumns = enableRowSelection ? [selectColumn, ...columns] : columns;

	const table = useReactTable({
		data,
		columns: allColumns,
		state: { sorting, globalFilter, rowSelection, expanded },
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onExpandedChange: setExpanded,
		getRowCanExpand: () => !!renderSubComponent,
		onRowSelectionChange: (updater) => {
			const next =
				typeof updater === "function" ? updater(rowSelection) : updater;
			setRowSelection(next);
			if (onSelectionChange) {
				const selectedRowIds = Object.keys(next);
				const selected =
					selectedRowIds.length === 0
						? []
						: table
								.getRowModel()
								.rows.filter((r) => next[r.id])
								.map((r) => r.original);
				onSelectionChange(selected);
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
	});

	const selectedCount = table.getFilteredSelectedRowModel().rows.length;
	const totalCount = table.getFilteredRowModel().rows.length;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<Input
					placeholder={filterPlaceholder}
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="h-8 max-w-sm text-xs"
				/>
				{enableRowSelection ? (
					<span className="text-muted-foreground text-xs">
						{selectedCount > 0
							? `${selectedCount} of ${totalCount} selected`
							: `${totalCount} ${noun}`}
					</span>
				) : (
					<span className="text-muted-foreground text-xs">
						{totalCount} ${noun}
					</span>
				)}
				{extraToolbarAction && (
					<div className="ml-auto flex items-center gap-2">
						{extraToolbarAction}
					</div>
				)}
			</div>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const canSort = header.column.getCanSort();
									const sorted = header.column.getIsSorted();
									return (
										<TableHead
											key={header.id}
											className={cn(
												"px-4 py-2.5",
												canSort && "cursor-pointer select-none",
											)}
											onClick={
												canSort
													? header.column.getToggleSortingHandler()
													: undefined
											}
										>
											<div className="flex items-center gap-1">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
												{canSort && (
													<span className="text-muted-foreground/60">
														{sorted === "asc" ? (
															<ChevronUp className="size-3" />
														) : sorted === "desc" ? (
															<ChevronDown className="size-3" />
														) : (
															<ChevronsUpDown className="size-3" />
														)}
													</span>
												)}
											</div>
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={allColumns.length}
									className="py-10 text-center text-muted-foreground text-xs"
								>
									No results.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<React.Fragment key={row.id}>
									<TableRow
										onClick={
											onRowClick
												? () => onRowClick(row.original)
												: renderSubComponent
													? () => row.toggleExpanded()
													: undefined
										}
										data-state={row.getIsSelected() && "selected"}
										className={cn(
											(onRowClick || renderSubComponent) &&
												"cursor-pointer hover:bg-muted/50",
											row.getIsExpanded() && "bg-muted/20 border-b-0",
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="px-4 py-2.5">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
									{row.getIsExpanded() && renderSubComponent && (
										<TableRow className="bg-muted/20 hover:bg-muted/20">
											<TableCell
												colSpan={allColumns.length}
												className="p-0 border-b"
											>
												{renderSubComponent({ row: row.original })}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
