type PaginationProps = {
  currentPage: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
};

export function Pagination({ currentPage, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <button
          key={pageIndex}
          type="button"
          aria-label={`${pageIndex + 1}페이지로 이동`}
          onClick={() => onPageChange(pageIndex)}
          className={`rounded-full border-[0.25px] border-collection-border p-0 ${
            currentPage === pageIndex
              ? "size-3 bg-collection-indicator"
              : "size-2 bg-collection-shelf"
          }`}
        />
      ))}
    </div>
  );
}
