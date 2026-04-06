import TaskForm from './TaskForm';

function TasksManagementView({ taskText, onTaskTextChange, onTaskAdd }) {
  return (
    <>
      <TaskForm value={taskText} onChange={onTaskTextChange} onSubmit={onTaskAdd} />
      <div className="management-info">
        <p>Modo gestión: puedes añadir tareas, importar JSON y usar el prompt IA.</p>
      </div>
    </>
  );
}

export default TasksManagementView;
