import React, { useState, useEffect, useMemo } from "react";
import { getMailingListSubscribers, MailingListSubscriber } from "../../api/users";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  FilterFn,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

export function AdminMailingListPage() {
  const [subscribers, setSubscribers] = useState<MailingListSubscriber[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const data = await getMailingListSubscribers();
        setSubscribers(data);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
      }
    };
    fetchSubscribers();
  }, []);

  const columnHelper = createColumnHelper<MailingListSubscriber>();

  const columns = useMemo<ColumnDef<MailingListSubscriber, any>[]>(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("subscribed", {
        header: "Status",
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              info.getValue()
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {info.getValue() ? "Subscribed" : "Unsubscribed"}
          </span>
        ),
      }),
      columnHelper.accessor("welcome_email_sent", {
        header: "Welcome Email",
        cell: (info) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              info.getValue()
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {info.getValue() ? "Sent" : "Pending"}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created At",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("updated_at", {
        header: "Updated At",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: subscribers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mailing List Subscribers</h1>
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          placeholder="Search all columns..."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead className="bg-gray-800 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-2 px-4 text-left cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 