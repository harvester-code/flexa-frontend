import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PagingProps {
  currentPage: number; // 현재 페이지
  totalPage: number; // 총 페이지 수
  visiblePageAmount?: number;
  onChangePage: (page: number) => void;
}

export default function Paging({ currentPage, totalPage, visiblePageAmount = 10, onChangePage }: PagingProps) {
  const startPage = Math.floor((currentPage - 1) / visiblePageAmount) * visiblePageAmount + 1;
  return (
    <div className="paging">
      <button
        className="arrow-button"
        onClick={() => {
          if (onChangePage) onChangePage(Math.max(currentPage - visiblePageAmount, 1));
        }}
      >
        <ChevronsLeft className="size-4" />
      </button>

      <button
        className="arrow-button"
        onClick={() => {
          if (onChangePage) onChangePage(Math.max(currentPage - 1, 1));
        }}
      >
        <ChevronLeft className="size-4" />
      </button>

      {Array.from({ length: Math.min(visiblePageAmount, totalPage - startPage + 1) }, (_, index) => (
        <button
          key={startPage + index}
          className={`paging-button ${currentPage === startPage + index ? 'active' : ''}`}
          onClick={() => {
            if (onChangePage) onChangePage(startPage + index);
          }}
        >
          {startPage + index}
        </button>
      ))}

      <button
        className="arrow-button"
        onClick={() => {
          if (onChangePage) onChangePage(Math.min(currentPage + 1, totalPage));
        }}
      >
        <ChevronRight className="size-4" />
      </button>

      <button
        className="arrow-button"
        onClick={() => {
          if (onChangePage) onChangePage(Math.min(currentPage + visiblePageAmount, totalPage));
        }}
      >
        <ChevronsRight className="size-4" />
      </button>
    </div>
  );
}
