/* ----------------------------------------------------------
   HORARIO SEMANAL
   - Carga tareas pendientes desde loadTasks()
   - Permite tareas manuales para el horario
   - Franjas apilables (múltiples tareas por celda)
   - Selección múltiple de franjas y acciones masivas
   - Persistencia con saveSchedule()
   ---------------------------------------------------------- */

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22

let selectedTask = null;
let currentWeekDate = new Date();
let schedule = normalizeSchedule(loadSchedule());
let pendingTasks = [];
let selectedSlots = new Set();

function getMonday(date){
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Ajuste para que el lunes sea el primero
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - diff);
  return d;
}

function getWeekDates(referenceDate){
  const monday = getMonday(referenceDate);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

function formatDateKey(date){
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0,10);
}

function getDateFromLegacyDayKey(dayKey){
  const weekDates = getWeekDates(currentWeekDate);
  if(dayKey === 0) return weekDates[6];
  return weekDates[Math.max(0, Math.min(6, dayKey - 1))];
}

function parseSlotKey(key){
  if(typeof key !== 'string') return {};
  const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})$/);
  if(dateMatch){
    const date = dateMatch[1];
    return { date, hour: Number(dateMatch[2]), dayKey: new Date(date).getDay() };
  }
  const legacyMatch = key.match(/^([0-6])-(\d{2})$/);
  if(legacyMatch){
    const dayKey = Number(legacyMatch[1]);
    const hour = Number(legacyMatch[2]);
    const date = formatDateKey(getDateFromLegacyDayKey(dayKey));
    return { date, hour, dayKey };
  }
  return {};
}

function slotKey(date, hour){
  const dateKey = typeof date === 'string' ? date : formatDateKey(date);
  return `${dateKey}-${String(hour).padStart(2, '0')}`;
}

function normalizeSchedule(raw){
  const base = raw && typeof raw === 'object' ? raw : {};
  const slots = base.slots && typeof base.slots === 'object' ? base.slots : {};

  const normalizedSlots = {};
  for(const [key, value] of Object.entries(slots)){
    const parsed = parseSlotKey(key);
    const normalizedKey = parsed.date && typeof parsed.hour === 'number'
      ? slotKey(parsed.date, parsed.hour)
      : key;

    if(Array.isArray(value)){
      normalizedSlots[normalizedKey] = value.filter(Boolean).map((item) => normalizeSlotTask(item, normalizedKey));
    } else if(value && typeof value === 'object'){
      normalizedSlots[normalizedKey] = [normalizeSlotTask(value, normalizedKey)];
    } else {
      normalizedSlots[normalizedKey] = [];
    }
  }

  return {
    version: 2,
    slots: normalizedSlots,
    customTasks: Array.isArray(base.customTasks) ? base.customTasks : []
  };
}

function normalizeSlotTask(task, slotKey){
  const parsed = parseSlotKey(slotKey);
  const dateString = parsed.date || task.date || formatDateKey(new Date());
  const dayNumber = parsed.dayKey !== undefined
    ? parsed.dayKey
    : (task.dayKey !== undefined ? task.dayKey : new Date(dateString).getDay());
  return {
    assignmentId:  task.assignmentId || `asg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id:            task.id,
    text:          task.text || 'Sin título',
    source:        task.source || 'tasks',
    assignedAt:    task.assignedAt || new Date().toISOString(),
    date:          dateString,
    dayKey:        typeof dayNumber === 'number' ? dayNumber : new Date(dateString).getDay(),
    hour:          typeof task.hour === 'number' ? task.hour : parsed.hour,
    durationMinutes: typeof task.durationMinutes === 'number' ? task.durationMinutes : 60,
    completed:     typeof task.completed === 'boolean' ? task.completed : false
  };
}

function priorityText(priority){
  return ({ alta: 'Alta', normal: 'Normal', baja: 'Baja' })[priority] || 'Normal';
}

function escapeHtml(text){
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function saveScheduleState(message){
  saveSchedule(schedule);
  setFeedback(message || 'Horario guardado.');
}

function formatDayHeader(day){
  return day.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
    .replace('.', '');
}

function formatWeekRange(weekDates){
  const start = weekDates[0];
  const end = weekDates[6];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
  const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
  const year = start.getFullYear();

  if(startMonth === endMonth){
    return `Semana del ${startDay} al ${endDay} de ${startMonth} de ${year}`;
  }
  return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${year}`;
}

function updateWeekRangeText(weekDates){
  const text = formatWeekRange(weekDates);
  const rangeNode = document.getElementById('weekRangeText');
  if(rangeNode) rangeNode.textContent = text;
}

function showPreviousWeek(){
  currentWeekDate = new Date(currentWeekDate);
  currentWeekDate.setDate(currentWeekDate.getDate() - 7);
  selectedSlots.clear();
  renderSelectedSlotsBadge();
  renderPlanner();
  setFeedback('Semana anterior.');
}

function showNextWeek(){
  currentWeekDate = new Date(currentWeekDate);
  currentWeekDate.setDate(currentWeekDate.getDate() + 7);
  selectedSlots.clear();
  renderSelectedSlotsBadge();
  renderPlanner();
  setFeedback('Semana siguiente.');
}

function showCurrentWeek(){
  currentWeekDate = new Date();
  selectedSlots.clear();
  renderSelectedSlotsBadge();
  renderPlanner();
  setFeedback('Semana actual.');
}

function syncTaskRemainingMinutesForAssignment(assignment, completedState){
  if(!assignment || assignment.source !== 'tasks' || assignment.id == null) return;

  const tasksList = loadTasks();
  const taskIndex = tasksList.findIndex(t => String(t.id) === String(assignment.id));
  if(taskIndex < 0) return;

  const task = tasksList[taskIndex];
  const duration = typeof assignment.durationMinutes === 'number' ? assignment.durationMinutes : 60;
  const estimated = typeof task.estimatedMinutes === 'number' ? task.estimatedMinutes : 0;
  const currentRemaining = typeof task.remainingMinutes === 'number' ? task.remainingMinutes : estimated;

  let updatedRemaining = currentRemaining;
  if(completedState){
    updatedRemaining = Math.max(0, currentRemaining - duration);
  } else {
    updatedRemaining = currentRemaining + duration;
    if(estimated > 0) updatedRemaining = Math.min(updatedRemaining, estimated);
  }

  task.remainingMinutes = updatedRemaining;
  tasksList[taskIndex] = task;
  saveTasks(tasksList);
}

function setFeedback(text){
  const feedback = document.getElementById('feedback');
  if(!feedback) return;
  feedback.textContent = text;
}

function setSelectedTask(task){
  selectedTask = task;
  const badge = document.getElementById('selectedTaskBadge');
  if(!badge) return;

  if(!task){
    badge.className = 'badge badge-cyan';
    badge.textContent = 'Ninguna';
    return;
  }

  badge.className = task.source === 'custom' ? 'badge badge-emerald' : 'badge badge-cyan';
  badge.textContent = `${task.text}`;
}

function renderSelectedSlotsBadge(){
  const badge = document.getElementById('selectedSlotsBadge');
  if(!badge) return;
  const count = selectedSlots.size;
  badge.textContent = `${count} ${count === 1 ? 'franja' : 'franjas'}`;
}

function loadPendingTasks(){
  const raw = loadTasks();
  pendingTasks = Array.isArray(raw) ? raw.filter(t => t && !t.done) : [];
}

function renderTaskLists(){
  const pendingList = document.getElementById('pendingTaskList');
  const customList = document.getElementById('customTaskList');

  if(pendingList){
    if(!pendingTasks.length){
      pendingList.innerHTML = '<div class="hint">No hay tareas pendientes.</div>';
    } else {
      pendingList.innerHTML = pendingTasks.map(task => {
        const active = selectedTask && selectedTask.source === 'tasks' && selectedTask.id === task.id;
        return `
          <button type="button" class="task-pill ${active ? 'active' : ''}" data-source="tasks" data-id="${task.id}">
            ${escapeHtml(task.text)}
            <small>${priorityText(task.priority)}${task.dueDate ? ` · ${task.dueDate}` : ''}</small>
          </button>
        `;
      }).join('');
    }
  }

  if(customList){
    if(!schedule.customTasks.length){
      customList.innerHTML = '<div class="hint">Aún no tienes tareas manuales.</div>';
    } else {
      customList.innerHTML = schedule.customTasks.map(task => {
        const active = selectedTask && selectedTask.source === 'custom' && selectedTask.id === task.id;
        return `
          <button type="button" class="task-pill ${active ? 'active' : ''}" data-source="custom" data-id="${task.id}">
            ${escapeHtml(task.text)}
            <small>Manual</small>
          </button>
        `;
      }).join('');
    }
  }

  bindTaskSelectionEvents();
}

function bindTaskSelectionEvents(){
  const pills = document.querySelectorAll('[data-source][data-id]');
  pills.forEach(node => {
    node.addEventListener('click', () => {
      const source = node.getAttribute('data-source');
      const id = node.getAttribute('data-id');

      if(source === 'tasks'){
        const task = pendingTasks.find(t => String(t.id) === String(id));
        if(task) setSelectedTask({ id: task.id, text: task.text, source: 'tasks' });
      }

      if(source === 'custom'){
        const task = schedule.customTasks.find(t => String(t.id) === String(id));
        if(task) setSelectedTask({ id: task.id, text: task.text, source: 'custom' });
      }

      renderTaskLists();
    });
  });
}

function getSlotTasks(key){
  if(!Array.isArray(schedule.slots[key])) schedule.slots[key] = [];
  return schedule.slots[key];
}

function renderPlanner(){
  const grid = document.getElementById('plannerGrid');
  if(!grid) return;

  const visibleDays = getWeekDates(currentWeekDate);
  updateWeekRangeText(visibleDays);

  let html = '<div class="cell day-head"></div>';
  html += visibleDays.map(day => `<div class="cell day-head">${formatDayHeader(day)}</div>`).join('');

  for(const hour of HOURS){
    html += `<div class="cell hour-head">${String(hour).padStart(2, '0')}:00</div>`;

    for(const day of visibleDays){
      const dateKey = formatDateKey(day);
      const key = slotKey(dateKey, hour);
      const items = getSlotTasks(key);
      const isSelected = selectedSlots.has(key);

      if(items.length){
        html += `
          <div class="cell slot ${isSelected ? 'selected' : ''}" data-slot="${key}" title="Clic para seleccionar franja">
            <div class="slot-stack">
              ${items.map(item => {
                const sourceClass = item.source === 'custom' ? 'manual' : '';
                return `
                  <div class="slot-card ${sourceClass} ${item.completed ? 'completed' : ''}">
                    <div class="slot-card-title">${escapeHtml(item.text)}</div>
                    <div class="slot-card-meta">
                      <span class="badge ${item.source === 'custom' ? 'badge-emerald' : 'badge-cyan'}">${item.source === 'custom' ? 'Manual' : 'Pendiente'}</span>
                      <div class="slot-card-actions">
                        <button type="button" class="slot-toggle-completed" data-toggle-completed="${item.assignmentId}" data-slot="${key}">${item.completed ? 'Deshacer' : 'Hecho'}</button>
                        <button type="button" class="slot-remove" data-remove-slot="${key}" data-assignment-id="${item.assignmentId}">Quitar</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        html += `<div class="cell slot empty ${isSelected ? 'selected' : ''}" data-slot="${key}"></div>`;
      }
    }
  }

  grid.innerHTML = html;
  bindSlotEvents();
}

function bindSlotEvents(){
  const slots = document.querySelectorAll('[data-slot]');
  slots.forEach(slot => {
    slot.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-remove-slot]');
      if(removeBtn) return;

      const key = slot.getAttribute('data-slot');
      toggleSlotSelection(key);
    });
  });

  const toggleButtons = document.querySelectorAll('[data-toggle-completed]');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const key = btn.getAttribute('data-slot');
      const assignmentId = btn.getAttribute('data-toggle-completed');
      toggleAssignmentCompleted(key, assignmentId);
    });
  });

  const removeButtons = document.querySelectorAll('[data-remove-slot]');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const key = btn.getAttribute('data-remove-slot');
      const assignmentId = btn.getAttribute('data-assignment-id');
      removeAssignment(key, assignmentId);
    });
  });
}

function toggleSlotSelection(key){
  if(selectedSlots.has(key)) selectedSlots.delete(key);
  else selectedSlots.add(key);

  renderSelectedSlotsBadge();
  renderPlanner();
}

function removeAssignment(key, assignmentId){
  const current = getSlotTasks(key);
  schedule.slots[key] = current.filter(item => item.assignmentId !== assignmentId);
  saveScheduleState('Asignación eliminada.');
  renderPlanner();
}

function toggleAssignmentCompleted(key, assignmentId){
  const current = getSlotTasks(key);
  const index = current.findIndex(item => item.assignmentId === assignmentId);
  if(index < 0) return;

  const assignment = current[index];
  const newCompleted = !assignment.completed;
  current[index] = {
    ...assignment,
    completed: newCompleted
  };

  if(assignment.source === 'tasks'){
    syncTaskRemainingMinutesForAssignment(assignment, newCompleted);
  }

  saveScheduleState(newCompleted ? 'Bloque marcado como completado.' : 'Bloque desmarcado.');
  renderPlanner();
}

function applySelectedTaskToSelection(){
  if(!selectedTask){
    setFeedback('Selecciona una tarea antes de aplicar a franjas.');
    return;
  }

  if(selectedSlots.size === 0){
    setFeedback('Selecciona al menos una franja.');
    return;
  }

  let added = 0;
  for(const key of selectedSlots){
    const tasks = getSlotTasks(key);
    const parsed = parseSlotKey(key);
    tasks.push({
      assignmentId:    `asg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      id:              selectedTask.id,
      text:            selectedTask.text,
      source:          selectedTask.source,
      assignedAt:      new Date().toISOString(),
      date:            parsed.date,
      dayKey:          typeof parsed.dayKey === 'number' ? parsed.dayKey : new Date(parsed.date).getDay(),
      hour:            parsed.hour,
      durationMinutes: 60,
      completed:       false
    });
    added++;
  }

  saveScheduleState(`Tarea añadida a ${added} ${added === 1 ? 'franja' : 'franjas'}.`);
  renderPlanner();
}

function clearSlotSelection(){
  selectedSlots.clear();
  renderSelectedSlotsBadge();
  renderPlanner();
  setFeedback('Selección limpiada.');
}

function clearTasksFromSelection(){
  if(selectedSlots.size === 0){
    setFeedback('No hay franjas seleccionadas.');
    return;
  }

  for(const key of selectedSlots){
    schedule.slots[key] = [];
  }

  saveScheduleState('Tareas eliminadas de las franjas seleccionadas.');
  renderPlanner();
}

function addManualTask(){
  const input = document.getElementById('manualTaskInput');
  if(!input) return;

  const text = input.value.trim();
  if(!text){
    setFeedback('Escribe un nombre para la tarea manual.');
    return;
  }

  const task = {
    id: `custom-${Date.now()}`,
    text,
    source: 'custom',
    createdAt: new Date().toISOString()
  };

  schedule.customTasks.push(task);
  input.value = '';
  setSelectedTask(task);
  saveScheduleState('Tarea manual creada.');
  renderTaskLists();
}

function bindStaticEvents(){
  document.getElementById('addManualTaskBtn')?.addEventListener('click', addManualTask);

  document.getElementById('manualTaskInput')?.addEventListener('keydown', (event) => {
    if(event.key === 'Enter'){
      event.preventDefault();
      addManualTask();
    }
  });

  document.getElementById('applyToSelectionBtn')?.addEventListener('click', applySelectedTaskToSelection);
  document.getElementById('clearSelectionBtn')?.addEventListener('click', clearSlotSelection);
  document.getElementById('clearTasksFromSelectionBtn')?.addEventListener('click', clearTasksFromSelection);

  document.getElementById('prevWeekBtn')?.addEventListener('click', showPreviousWeek);
  document.getElementById('nextWeekBtn')?.addEventListener('click', showNextWeek);
  document.getElementById('todayWeekBtn')?.addEventListener('click', showCurrentWeek);

  document.getElementById('printBtn')?.addEventListener('click', () => {
    window.print();
  });
}

function initHorario(){
  loadPendingTasks();
  bindStaticEvents();
  setSelectedTask(null);
  renderSelectedSlotsBadge();
  renderTaskLists();
  renderPlanner();
  setFeedback('Horario listo.');
}

initHorario();
