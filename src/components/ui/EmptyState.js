function EmptyState({ hasQuery, queryMessage, defaultMessage, role }) {
  return (
    <p className="empty-state" role={role}>
      {hasQuery ? queryMessage : defaultMessage}
    </p>
  );
}

export default EmptyState;
