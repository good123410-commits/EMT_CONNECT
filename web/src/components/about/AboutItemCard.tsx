import type { KemixAboutItem } from '../../types';

type AboutItemCardProps = {
  item: KemixAboutItem;
  onOpen: (item: KemixAboutItem) => void;
  showUnpublished?: boolean;
  onEdit?: (item: KemixAboutItem) => void;
  onDelete?: (item: KemixAboutItem) => void;
};

export function AboutItemCard({
  item,
  onOpen,
  showUnpublished,
  onEdit,
  onDelete,
}: AboutItemCardProps) {
  return (
    <article className={`about-item-card${!item.is_published && showUnpublished ? ' about-item-card--draft' : ''}`}>
      <button type="button" className="about-item-card-body" onClick={() => onOpen(item)}>
        {item.badge_label ? <span className="about-item-badge">{item.badge_label}</span> : null}
        <h3 className="about-item-card-title">{item.title}</h3>
        {item.summary ? <p className="about-item-card-summary">{item.summary}</p> : null}
        <span className="about-item-card-cta">자세히 보기</span>
      </button>

      {onEdit || onDelete ? (
        <div className="about-item-card-admin">
          {onEdit ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(item)}>
              수정
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(item)}>
              삭제
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function AboutItemCreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="about-item-card about-item-card--create" onClick={onClick}>
      <span className="poll-card-plus">+</span>
      <span className="poll-card-create-label">새 항목 추가</span>
    </button>
  );
}
