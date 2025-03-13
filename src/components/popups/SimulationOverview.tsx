import { Ban, Link2, Plus, Search } from 'lucide-react';
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
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';

interface SimulationOverviewProps {
  className?: string;
  selectedItem: string[];
}

function SimulationOverview({ className, selectedItem }: SimulationOverviewProps) {
  return (
    <>
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
              {selectedItem &&
                selectedItem.map((item, idx) => (
                  <li className="flex items-center gap-2.5" key={idx}>
                    <button className="flex h-6 items-center rounded-md bg-accent-50 px-2 font-medium text-accent-700">
                      {item}
                    </button>
                  </li>
                ))}
            </ul>
          </dd>
        </dl>

        <div className="flex items-center gap-2.5">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
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

              <div>
                <div className="ml-auto flex max-w-72 items-center border-b p-2.5">
                  <Input
                    className="max-h-6 border-none border-default-400 shadow-none focus-visible:ring-transparent"
                    placeholder="Search"
                  />
                  <Search className="ml-1" />
                </div>

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
              </div>
            </DialogContent>
          </Dialog>

          <Button>See Results</Button>
        </div>
      </div>
    </>
  );
}

export default SimulationOverview;
