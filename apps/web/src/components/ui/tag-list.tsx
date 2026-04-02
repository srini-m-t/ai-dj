type TagListProps = {
  tags: readonly string[];
};

/**
 * Reusable tag pill list.
 */
export function TagList({ tags }: TagListProps) {
  return (
    <div className="pill-list">
      {tags.map((tag) => (
        <div key={tag} className="pill">
          {tag}
        </div>
      ))}
    </div>
  );
}