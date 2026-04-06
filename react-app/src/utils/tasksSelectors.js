export function getPendingTasks(tasks) {
  return tasks
    .filter((task) => !task.done)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt));
}

export function getCompletedTasks(tasks) {
  return tasks
    .filter((task) => task.done)
    .slice()
    .sort((a, b) =>
      (a.completedAt || '').localeCompare(b.completedAt || '') ||
      a.createdAt.localeCompare(b.createdAt)
    );
}

export function getFilteredTasks(pendingTasks, completedTasks, filter) {
  if (filter === 'pending') return pendingTasks;
  if (filter === 'completed') return completedTasks;
  return [...pendingTasks, ...completedTasks];
}

export function getFocusTask(pendingTasks) {
  const highlighted = pendingTasks.find((task) => task.highlighted);
  return highlighted || pendingTasks[0] || null;
}

export function getPendingPositionById(pendingTasks) {
  return pendingTasks.reduce((map, task, index) => {
    map[task.id] = index + 1;
    return map;
  }, {});
}

export function getNextPendingOrder(tasks) {
  return (
    tasks.reduce(
      (max, task) =>
        Math.max(max, task.done ? max : typeof task.order === 'number' ? task.order : 0),
      0
    ) + 1
  );
}
