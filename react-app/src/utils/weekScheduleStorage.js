const STORAGE_KEY = 'weekSchedule';

function normalizeAssignment(assignment, index = 0) {
  return {
    id: assignment.id ?? Date.now() + index,
    text: assignment.text || assignment.taskText || 'Nueva asignación',
    date: assignment.date || null,
    hour: typeof assignment.hour === 'number' ? assignment.hour : Number(assignment.hour) || 7,
    taskId: assignment.taskId ?? null,
    taskText: assignment.taskText || assignment.text || null,
    createdAt: assignment.createdAt || new Date().toISOString(),
  };
}

function normalizeSchedule(raw) {
  if (!raw || typeof raw !== 'object') {
    return { version: 1, slots: {} };
  }

  const slots = raw.slots && typeof raw.slots === 'object' ? raw.slots : {};
  const normalizedSlots = {};

  for (const [key, value] of Object.entries(slots)) {
    if (Array.isArray(value)) {
      normalizedSlots[key] = value.map((assignment, index) => normalizeAssignment(assignment, index));
    } else if (value && typeof value === 'object') {
      normalizedSlots[key] = [normalizeAssignment(value)];
    } else {
      normalizedSlots[key] = [];
    }
  }

  return { version: 1, slots: normalizedSlots };
}

function loadSchedule() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { version: 1, slots: {} };

  try {
    const parsed = JSON.parse(raw);
    return normalizeSchedule(parsed);
  } catch (error) {
    console.warn('Failed to parse week schedule from localStorage:', error);
    return { version: 1, slots: {} };
  }
}

function saveSchedule(schedule) {
  const normalized = normalizeSchedule(schedule);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function createAssignment(text, date, hour, taskId = null, taskText = null) {
  return {
    id: Date.now(),
    text: text.trim() || taskText || 'Tarea rápida',
    date,
    hour,
    taskId,
    taskText: taskText || text.trim() || null,
    createdAt: new Date().toISOString(),
  };
}

export { loadSchedule, saveSchedule, createAssignment, normalizeSchedule };