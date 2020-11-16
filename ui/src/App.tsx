import React, { useEffect, useState } from "react";
import {
  Column,
  useFilters,
  UseFiltersColumnOptions,
  useTable,
  useSortBy,
  UseSortByColumnOptions,
  UseFiltersColumnProps,
  CellProps,
} from "react-table";
import { DealershipWithInventory } from "@local/types";

const currencyFormat = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

// Define a default UI for filtering
function DefaultColumnFilter<D extends object>({
  column: { filterValue, preFilteredRows, setFilter },
}: {
  column: UseFiltersColumnProps<D> & { id: string };
}) {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
    />
  );
}

// // a unique option from a list
function SelectColumnFilter<D extends object>({
  column: { filterValue, setFilter, preFilteredRows, id },
}: {
  column: UseFiltersColumnProps<D> & { id: string };
}) {
  // Calculate the options for filtering using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set<D[]>();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id]);
    });
    return Array.from(options);
  }, [id, preFilteredRows]);

  return (
    <select
      // TODO: make this multiselect
      // multiple
      value={filterValue}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        // @ts-expect-error
        <option key={i} value={option}>
          {option} (
          {preFilteredRows.filter((row) => row.values[id] === option).length})
        </option>
      ))}
    </select>
  );
}

function App() {
  const [dealershipsInventory, setDealershipsInventory] = useState<
    Array<DealershipWithInventory>
  >();

  useEffect(() => {
    fetch("/api/getAllDealershipsInventory")
      .then(async (response) => {
        const json = await response.json();
        setDealershipsInventory(json);
      })
      .catch((e) => console.error("error", e));
  }, []);

  const inventoryAcrossDealerships = React.useMemo(
    () =>
      dealershipsInventory?.flatMap((dealership) => {
        return dealership.inventory.map((x) => ({
          ...x,
          dealership,
        }));
      }),
    [dealershipsInventory]
  );

  const columns = React.useMemo(() => {
    if (!inventoryAcrossDealerships) return [];
    const columns: Array<
      UseSortByColumnOptions<typeof inventoryAcrossDealerships[number]> &
        UseFiltersColumnOptions<typeof inventoryAcrossDealerships[number]> &
        Column<typeof inventoryAcrossDealerships[number]>
    > = [
      {
        Header: "Model",
        accessor: "model",
        Cell: ({ row }) => {
          return <a href={row.original.url}>{row.original.model}</a>;
        },
        Filter: SelectColumnFilter,
        filter: "includes",
      },
      {
        Header: "Trim",
        accessor: "trim",
        Filter: SelectColumnFilter,
      },
      {
        Header: "Year",
        accessor: "year",
      },
      {
        Header: "Days on Lot",
        accessor: (row) => row.days_on_lot || "unknown",
      },
      {
        Header: "Exterior Color",
        accessor: (row) => row.exterior_color,
        Filter: DefaultColumnFilter,
        filter: "includes",
      },
      {
        Header: "MSRP",
        accessor: (row) =>
          row.msrp ? currencyFormat.format(row.msrp) : "unknown",
      },
      {
        Header: "Dealership",
        accessor: (row) => row.dealership.name,
        Cell: ({
          row,
        }: CellProps<typeof inventoryAcrossDealerships[number]>) => (
          <a href={row.original.dealership.website.url}>
            {row.original.dealership.name}
          </a>
        ),
        Filter: SelectColumnFilter,
      },
    ];
    return columns;
  }, [inventoryAcrossDealerships]);

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: () => null,
      sortType: "alphanumeric",
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: inventoryAcrossDealerships ?? [],
      // @ts-expect-error
      defaultColumn,
    },
    useFilters,
    useSortBy
  );

  return (
    <div className="App">
      <table {...getTableProps()} style={{ border: "solid 1px blue" }}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  // @ts-expect-error
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  style={{
                    borderBottom: "solid 3px red",
                    background: "aliceblue",
                    color: "black",
                    fontWeight: "bold",
                  }}
                >
                  <div style={{ display: "flex" }}>
                    {column.render("Header")}

                    <span>
                      {
                        // @ts-expect-error
                        column.isSorted
                          ? // @ts-expect-error
                            column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : " ↕️"
                      }
                    </span>
                  </div>
                  {
                    // @ts-expect-error
                    column.canFilter && (
                      <div style={{ marginLeft: "0.25rem" }}>
                        {column.render("Filter")}
                      </div>
                    )
                  }
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        padding: "10px",
                        border: "solid 1px gray",
                        background: "papayawhip",
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
