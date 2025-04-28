import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import dayjs from 'dayjs';
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
  scenario: ScenarioData | null;
  onSelectScenario: Dispatch<SetStateAction<any>>;
}

const columnHelper = createColumnHelper<ScenarioData>();

const fallbackData: ScenarioData[] = [];

function SimulationOverview({ className, items, scenario, onSelectScenario }: SimulationOverviewProps) {
  const [isOpened, setIsOpened] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor('simulation_name', {
        header: () => <span>Simulation Name</span>,
        cell: (info) => (
          <p
            className="flex cursor-pointer items-center gap-2.5 hover:font-bold"
            onClick={() => {
              onSelectScenario(info.row.original);
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
        header: () => <span>Created at</span>,
        cell: (info) => dayjs(info.getValue()).format('MMM-DD-YYYY HH:mm'),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('updated_at', {
        header: () => <p>Last updated at</p>,
        cell: (info) => dayjs(info.getValue()).format('MMM-DD-YYYY HH:mm'),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('memo', {
        header: () => <p>Memo</p>,
        footer: (info) => info.column.id,
      }),
    ],
    [onSelectScenario]
  );

  const table = useReactTable({
    columns: columns,
    data: items ?? fallbackData,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn(
        'flex min-h-20 items-center justify-between rounded-md border border-default-200 px-5 py-2.5 text-sm',
        className
      )}
    >
      <dl className="flex items-center gap-5">
        {scenario ? (
          <>
            <dt className="font-semibold text-default-900">Selected</dt>
            <dd>
              <ul className="flex flex-wrap items-center gap-2.5">
                <li className="flex items-center gap-2.5">
                  <span className="flex items-center rounded-md bg-accent-50 px-2 font-medium text-accent-700">
                    {scenario?.simulation_name}
                  </span>
                </li>
              </ul>
            </dd>
          </>
        ) : (
          <dt className="text-accent-600">Please select the scenario</dt>
        )}
      </dl>

      <Dialog open={isOpened} onOpenChange={setIsOpened}>
        <DialogTrigger asChild>
          <Button>
            <Link2 /> Select Scenario
          </Button>
        </DialogTrigger>

        <DialogContent className="h-full max-h-[39rem] max-w-[90%] overflow-auto xl:max-w-[70rem]">
          <DialogHeader>
            <DialogTitle className="flex items-baseline justify-between pt-1.5">
              <span>Select Scenario</span>
              <Button className="right-5 top-5" type="submit">
                <Plus /> New Scenario
              </Button>
            </DialogTitle>

            <DialogDescription>Select the scenario you&apos;d like to review.</DialogDescription>
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
  );
}

export default SimulationOverview;
