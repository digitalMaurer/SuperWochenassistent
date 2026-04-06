import TaskCard from '../TaskCard';

function TaskList({
  tasks,
  pendingTasksLength,
  pendingPositionById,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDelete,
  onHighlight,
  onPlan,
  onSaveEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  return (
    <div className="task-list">
      {tasks.map((task) => {
        const position = pendingPositionById[task.id];
        return (
          <TaskCard
            key={task.id}
            task={task}
            position={position}
            canMoveUp={position != null && position > 1}
            canMoveDown={position != null && position < pendingTasksLength}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onToggle={onToggle}
            onDelete={onDelete}
            onHighlight={onHighlight}
            onPlan={onPlan}
            onSaveEdit={onSaveEdit}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        );
      })}
    </div>
  );
}

export default TaskList;
