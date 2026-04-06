function TaskForm({ value, onChange, onSubmit }) {
  return (
    <form className="task-form" onSubmit={onSubmit}>
      <input
        className="task-input"
        placeholder="Añadir nueva tarea..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button className="task-button" type="submit">
        Añadir
      </button>
    </form>
  );
}

export default TaskForm;
