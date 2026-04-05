const STORAGE_KEY = 'tasks';

function normalizeTask(task, index = 0) {
  const estimatedMinutes = typeof task.estimatedMinutes === 'number' ? task.estimatedMinutes : 0;
  const remainingMinutes = typeof task.remainingMinutes === 'number'
    ? task.remainingMinutes
    : estimatedMinutes;

  return {
    id: task.id ?? Date.now() + index,
    text: task.text || '',
    done: !!task.done,
    highlighted: !!task.highlighted,
    priority: task.priority || 'normal',
    dueDate: task.dueDate || null,
    notes: task.notes || '',
    tags: Array.isArray(task.tags) ? task.tags : [],
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
    estimatedMinutes,
    remainingMinutes,
    subs: Array.isArray(task.subs)
      ? task.subs.map((sub, subIndex) => ({
          id: sub.id ?? Date.now() + index + subIndex + 1,
          text: sub.text || '',
          done: !!sub.done,
          createdAt: sub.createdAt || new Date().toISOString(),
        }))
      : [],
  };
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.map((task, index) => normalizeTask(task, index));
}

function importTasks(data) {
  if (Array.isArray(data)) return normalizeTasks(data);
  if (data && typeof data === 'object') return normalizeTasks([data]);
  return [];
}

function loadTasks() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return normalizeTasks(parsed);
  } catch (error) {
    console.warn('Failed to parse tasks from localStorage:', error);
    return [];
  }
}

function saveTasks(tasks) {
  const normalized = normalizeTasks(tasks);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function createTask(text) {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    text: text.trim(),
    done: false,
    highlighted: false,
    priority: 'normal',
    dueDate: null,
    notes: '',
    tags: [],
    createdAt: now,
    completedAt: null,
    estimatedMinutes: 0,
    remainingMinutes: 0,
    subs: [],
  };
}

export { loadTasks, saveTasks, normalizeTasks, normalizeTask, createTask, importTasks };