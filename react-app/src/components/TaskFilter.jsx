function TaskFilter({ value, onChange }) {
  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'completed', label: 'Completadas' },
  ];

  return (
    <div className="task-filter">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          className={`filter-button ${value === filter.key ? 'active' : ''}`}
          onClick={() => onChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default TaskFilter;
