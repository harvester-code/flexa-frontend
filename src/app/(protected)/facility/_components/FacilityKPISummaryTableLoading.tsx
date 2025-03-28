import { Skeleton } from '@/components/ui/Skeleton';

function FacilityKPISummaryTableLoading() {
  return (
    <div className="flex h-80 items-center justify-center">Loading</div>

    // <div className="flex flex-col gap-1">
    //   {Array.from({ length: 5 }).map((_, idx) => (
    //     <div className="grid h-20 grid-cols-8 gap-1" key={idx}>
    //       <Skeleton className="col-span-2 rounded-lg" />
    //       <Skeleton className="rounded-lg" />
    //       <Skeleton className="rounded-lg" />
    //       <Skeleton className="col-span-2 rounded-lg" />
    //       <Skeleton className="col-span-2 rounded-lg" />
    //     </div>
    //   ))}
    // </div>
  );
}

export default FacilityKPISummaryTableLoading;
