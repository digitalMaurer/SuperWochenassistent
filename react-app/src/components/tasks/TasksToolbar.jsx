import TaskFilter from '../TaskFilter';

function TasksToolbar({ view, onChangeView, filter, onChangeFilter }) {
  return (
    <div className="view-controls">
      <div className="view-tabs">
        <button
          type="button"
          className={`tab-button ${view === 'gestion' ? 'active' : ''}`}
          onClick={() => onChangeView('gestion')}
        >
          Gestión
        </button>
        <button
          type="button"
          className={`tab-button ${view === 'foco' ? 'active' : ''}`}
          onClick={() => onChangeView('foco')}
        >
          Foco
        </button>
      </div>
      {view === 'gestion' && <TaskFilter value={filter} onChange={onChangeFilter} />}
    </div>
  );
}

export default TasksToolbar;
