type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPageItems(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | 'ellipsis')[] = [1];

  if (page > 3) items.push('ellipsis');

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i += 1) {
    items.push(i);
  }

  if (page < totalPages - 2) items.push('ellipsis');

  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(page, totalPages);

  return (
    <nav className="board-pagination" aria-label="게시글 페이지">
      <button
        type="button"
        className="board-pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        &lt;&lt; 이전
      </button>

      <div className="board-pagination-pages">
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="board-pagination-ellipsis" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`board-pagination-page${page === item ? ' board-pagination-page--active' : ''}`}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="board-pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음 &gt;&gt;
      </button>
    </nav>
  );
}
