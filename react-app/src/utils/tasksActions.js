import { createTask } from './tasksStorage';
import { getPendingTasks, getNextPendingOrder } from './tasksSelectors';

function reorderPendingTasks(sourceTasks, reorderedPending) {
  const pendingById = new Map(reorderedPending.map((task) => [task.id, task]));
  return sourceTasks.map((task) => (pendingById.has(task.id) ? pendingById.get(task.id) : task));
}

function moveTaskToPendingTop(sourceTasks, taskId) {
  const pending = getPendingTasks(sourceTasks);
  const target = pending.find((task) => task.id === taskId);
  if (!target) return sourceTasks;

  const reordered = [target, ...pending.filter((task) => task.id !== taskId)].map(
    (task, orderIndex) => ({
      ...task,
      order: orderIndex + 1,
    })
  );

  return reorderPendingTasks(sourceTasks, reordered);
}

export function addTask(tasks, text) {
  const newTask = createTask(text, getNextPendingOrder(tasks));
  return [...tasks, newTask];
}

export function toggleTaskDone(tasks, taskId) {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;

    const nextDone = !task.done;
    return {
      ...task,
      done: nextDone,
      completedAt: nextDone ? new Date().toISOString() : null,
      order: nextDone ? task.order : getNextPendingOrder(tasks),
    };
  });
}

export function deleteTask(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId);
}

export function highlightTask(tasks, taskId) {
  const updated = tasks.map((task) =>
    task.id === taskId ? { ...task, highlighted: !task.highlighted } : task
  );

  const toggled = updated.find((task) => task.id === taskId);
  if (toggled && toggled.highlighted && !toggled.done) {
    return moveTaskToPendingTop(updated, taskId);
  }

  return updated;
}

export function saveEditTask(tasks, taskId, patch) {
  return tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
}

export function movePendingTask(tasks, taskId, direction) {
  const pending = getPendingTasks(tasks);
  const index = pending.findIndex((task) => task.id === taskId);
  if (index === -1) return tasks;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= pending.length) return tasks;

  const reordered = [...pending];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

  const normalized = reordered.map((task, orderIndex) => ({
    ...task,
    order: orderIndex + 1,
  }));

  return reorderPendingTasks(tasks, normalized);
}

export function addSubtask(tasks, taskId, subtaskText) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          subs: [
            ...task.subs,
            {
              id: Date.now(),
              text: subtaskText,
              done: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      : task
  );
}

export function toggleSubtask(tasks, taskId, subtaskId) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          subs: task.subs.map((sub) =>
            sub.id === subtaskId ? { ...sub, done: !sub.done } : sub
          ),
        }
      : task
  );
}

export function deleteSubtask(tasks, taskId, subtaskId) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          subs: task.subs.filter((sub) => sub.id !== subtaskId),
        }
      : task
  );
}
