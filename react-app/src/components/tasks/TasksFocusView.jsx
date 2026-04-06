function TasksFocusView({ focusTask }) {
  if (!focusTask) {
    return (
      <div className="focus-empty">
        <p>No hay tareas pendientes para enfocar.</p>
        <p className="focus-note">Cambia al modo Gestión para ver todas tus tareas y crear nuevas.</p>
      </div>
    );
  }

  return (
    <div className="focus-summary">
      <h3>Tarea en foco</h3>
      <p>
        {focusTask.highlighted
          ? 'Mostrando la tarea destacada pendiente.'
          : 'Mostrando la primera tarea pendiente.'}
      </p>
      <p className="focus-note">Para gestionar o añadir tareas, cambia al modo Gestión.</p>
    </div>
  );
}

export default TasksFocusView;
