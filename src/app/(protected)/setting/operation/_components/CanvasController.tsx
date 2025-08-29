import { Hand, LandPlot, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

function CanvasController({ prevModeRef, mode, setMode, nodes, rectangles }) {
  const { toast } = useToast();
  return (
    <>
      {/* NOTE: 실제로는 어떤 UI에서 어떻게 사용될지 모르니 여기서 힘쓰지 말자. */}
      <div className="absolute bottom-3 left-0 right-0 mx-auto flex w-fit justify-center">
        <div className="flex gap-2 rounded-lg bg-muted p-2">
          <div
            className={cn('rounded p-1 hover:bg-muted', mode === 'view' && 'bg-muted hover:bg-muted')}
            onClick={() => setMode('view')}
          >
            <MousePointer2 />
          </div>

          <div
            className={cn('rounded p-1 hover:bg-muted', mode === 'grab' && 'bg-muted hover:bg-muted')}
            onClick={() => {
              prevModeRef.current = 'grab';
              setMode('grab');
            }}
          >
            <Hand />
          </div>

          <div
            className={cn('rounded p-1 hover:bg-muted', mode === 'draw' && 'bg-muted hover:bg-muted')}
            onClick={() => {
              if (nodes.length === rectangles.length) {
                toast({
                  title: "Warning",
                  description: "더 이상 영역을 지정할 수 없습니다.",
                  variant: "destructive"
                });
              } else {
                setMode('draw');
              }
            }}
          >
            <LandPlot />
          </div>
        </div>
      </div>
    </>
  );
}

export default CanvasController;
