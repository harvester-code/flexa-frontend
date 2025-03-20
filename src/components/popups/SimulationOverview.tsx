import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Ban, Calendar, Link2, Plus, Search } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Pagination';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';

interface SimulationOverviewProps {
  className?: string;
  items: ScenarioData[];
  selectedScenario: any[];
  onSelectedScenario: Dispatch<SetStateAction<any[]>>;
}

const columnHelper = createColumnHelper<ScenarioData>();

const fallbackData: ScenarioData[] = [];

function SimulationOverview({
  className,
  items,
  selectedScenario,
  onSelectedScenario,
}: SimulationOverviewProps) {
  const [isOpened, setIsOpened] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor('simulation_name', {
        // TODO: 클릭 범위 조정
        cell: (info) => (
          <p
            className="flex cursor-pointer items-center gap-2.5 hover:font-bold"
            onClick={() => {
              onSelectedScenario([info.row.original]);
              setIsOpened(false);
            }}
          >
            <Link2 width={28} height={28} /> {info.getValue()}
          </p>
        ),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.terminal, {
        id: 'Terminal',
        header: () => <span>Terminal</span>,
        cell: (info) => <i>{info.getValue()}</i>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('editor', {
        header: () => 'Editor',
        cell: (info) => info.renderValue(),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('simulation_date', {
        header: () => <span>Visits</span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('updated_at', {
        header: () => <p>Edit Date</p>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('memo', {
        header: () => <p>Memo</p>,
        footer: (info) => info.column.id,
      }),
    ],
    [onSelectedScenario]
  );

  const table = useReactTable({
    columns: columns,
    data: items ?? fallbackData,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn(
        'flex min-h-20 items-center justify-between rounded-md border border-default-200 px-5 py-2.5 text-xs',
        className
      )}
    >
      <dl className="flex items-center gap-5">
        <dt className="font-bold text-default-900">Selected</dt>

        <dd>
          <ul className="flex flex-wrap items-center gap-2.5">
            {selectedScenario &&
              selectedScenario.map((item, idx) => (
                <li className="flex items-center gap-2.5" key={idx}>
                  <span className="flex h-6 items-center rounded-md bg-accent-50 px-2 font-medium text-accent-700">
                    {item.simulation_name}
                  </span>
                </li>
              ))}
          </ul>
        </dd>
      </dl>

      <div className="flex items-center gap-2.5">
        <Dialog open={isOpened} onOpenChange={setIsOpened}>
          <DialogTrigger asChild>
            <Button>
              <Link2 /> Select Scenario
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[1300px]">
            <DialogHeader>
              <DialogTitle>
                Simulation Overview
                <Button className="absolute right-5 top-5" type="submit">
                  <Plus /> New Scenario
                </Button>
              </DialogTitle>
              <DialogDescription>
                You can modify, review results, or create new scenarios based on the simulation generated with
                the entered facility information.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="ml-auto flex items-center gap-2.5">
              {items.length > 0 && (
                <Button variant="outline" className="shadow-none">
                  <Calendar /> Simulation Target Date: All
                </Button>
              )}

              <div className="flex max-w-72 items-center border-b p-2.5">
                <Input
                  className="max-h-6 border-none border-default-400 shadow-none focus-visible:ring-transparent"
                  placeholder="Search"
                />
                <Search className="ml-1" />
              </div>
            </div>

            {items.length > 0 ? (
              <>
                <table className="table-fixed">
                  <thead className="border-b border-[#9e77ed] bg-default-100 text-left text-sm">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-3 py-3 font-medium">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-accent-50" onClick={row.getToggleSelectedHandler()}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationFirst href="#" />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLast href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-md border border-default-200 bg-default-50 py-[74px]">
                <Ban size={40} />

                <p className="text-2xl font-semibold">No Simulation Result Exists.</p>

                <p className="mt-3 font-medium text-default-600">
                  No results match the search term “New LCC_241030”.
                  <br />
                  Please try again or create a new scenario.
                </p>

                <p className="mt-12 flex items-center justify-center gap-2.5">
                  <Button variant="outline">Clear Search</Button>
                  <Button className="bg-black">
                    <Plus />
                    Create New Scenario
                  </Button>
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default SimulationOverview;
