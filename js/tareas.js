/* ----------------------------------------------------------
   1. ESTADO GLOBAL
   ---------------------------------------------------------- */
let view       = 'gestion';
let currentTab = 'pending';
let tasks      = normalizeTasks(JSON.parse(localStorage.getItem('tasks')) || []);
let backupJustDone  = false;
let statsVisible    = false;
// IDs de notas actualmente expandidas (persiste durante la sesión)
let expandedNotes   = new Set();
let editContext     = { type: null, taskId: null, subId: null };
// Etiquetas seleccionadas en el modal (array de strings)
let editSelectedTags = [];


/* ----------------------------------------------------------
   2. CONSTANTES — ETIQUETAS PREDEFINIDAS
   ---------------------------------------------------------- */

/**
 * Array de etiquetas predefinidas.
 * Cada entrada: { label: string, colorIndex: 0-7 }
 *
 * AMPLIACIÓN: Añade más entradas aquí para tener más opciones.
 * El colorIndex corresponde a las clases CSS .tag-opt-X y .tag-X.
 * Máximo recomendado: 12 etiquetas para que quepan bien en el modal.
 */
const PREDEFINED_TAGS = [
  { label: '💼 Trabajo',      colorIndex: 0 },
  { label: '🏠 Personal',     colorIndex: 1 },
  { label: '🎯 Urgente',      colorIndex: 3 },
  { label: '📚 Aprendizaje',  colorIndex: 2 },
  { label: '💡 Ideas',        colorIndex: 4 },
  { label: '⚙️ Config',       colorIndex: 6 },
  { label: '💬 Reunión',      colorIndex: 5 },
  { label: '🛒 Recados',      colorIndex: 7 },
];

/**
 * Devuelve el índice de color de una etiqueta por su label.
 * Busca en PREDEFINED_TAGS; si no está, usa un hash del texto.
 * @param {string} label
 * @returns {number} - 0-7
 */
function tagColorIndex(label){
  const found = PREDEFINED_TAGS.find(t => t.label === label);
  if(found) return found.colorIndex;
  // Hash simple para etiquetas personalizadas
  let h = 0;
  for(let c of label) h = (h * 31 + c.charCodeAt(0)) & 0xff;
  return h % 8;
}


/* ----------------------------------------------------------
   3. PERSISTENCIA
   ---------------------------------------------------------- */

/** Guarda en localStorage y marca que hay cambios sin auto-exportar. */
function save(){
  localStorage.setItem('tasks', JSON.stringify(tasks));
  backupJustDone = false; // Hay cambios nuevos sin exportar a fichero
}

/**
 * Guarda estadísticas de Pomodoro en localStorage (histórico por día).
 * Formato: { "YYYY-MM-DD": N_sesiones }
 */
function savePomStats(sessions){
  const today = new Date().toISOString().slice(0,10);
  const raw   = JSON.parse(localStorage.getItem('pom_stats') || '{}');
  raw[today]  = (raw[today] || 0) + sessions;
  localStorage.setItem('pom_stats', JSON.stringify(raw));
}

function loadPomStats(){
  return JSON.parse(localStorage.getItem('pom_stats') || '{}');
}


/* ----------------------------------------------------------
   4. NORMALIZACIÓN DE DATOS
   ---------------------------------------------------------- */

/**
 * Normaliza el array de tareas con todos los campos necesarios.
 *
 * AMPLIACIÓN — para añadir un campo nuevo:
 *   1. Añade la línea aquí con su valor por defecto.
 *   2. Recógelo en el modal (openEditModal / applyEdit).
 *   3. Muéstralo en renderGestion / renderArbol.
 */
function normalizeTasks(arr){
  return arr.map((t, i) => {
    const estimatedMinutes = typeof t.estimatedMinutes === 'number' ? t.estimatedMinutes : 0;
    return {
      id:               t.id          || Date.now() + i,
      text:             t.text        || '',
      done:             !!t.done,
      highlighted:      !!t.highlighted,
      priority:         t.priority    || 'normal',        // 'alta' | 'normal' | 'baja'
      dueDate:          t.dueDate     || null,             // 'YYYY-MM-DD' | null
      notes:            t.notes       || '',              // ← NUEVO v3: texto libre
      tags:             Array.isArray(t.tags) ? t.tags : [], // ← NUEVO v3: array de strings
      createdAt:        t.createdAt   || new Date().toISOString(),
      completedAt:      t.completedAt || null,             // ← NUEVO v3: fecha de completado
      estimatedMinutes: estimatedMinutes,
      remainingMinutes: typeof t.remainingMinutes === 'number'
        ? t.remainingMinutes
        : estimatedMinutes,
      subs: Array.isArray(t.subs)
        ? t.subs.map((s, si) => ({
            id:        s.id        || Date.now() + i + si + 1,
            text:      s.text      || '',
            done:      !!s.done,
            createdAt: s.createdAt || new Date().toISOString(),
          }))
        : []
    };
  });
}


/* ----------------------------------------------------------
   5. HELPERS
   ---------------------------------------------------------- */

function formatDate(iso){
  return new Date(iso).toLocaleString('es-ES',{
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}
function formatShortDate(iso){
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES',{
    day:'2-digit', month:'2-digit', year:'numeric'
  });
}
function elapsedFrom(iso){
  const diff = Date.now() - new Date(iso).getTime();
  const min=Math.floor(diff/60000), h=Math.floor(diff/3600000), d=Math.floor(diff/86400000);
  if(min<1)  return 'ahora mismo';
  if(min<60) return `hace ${min}m`;
  if(h<24)   return `hace ${h}h`;
  return `hace ${d}d`;
}
function isOverdue(dueDate){
  if(!dueDate) return false;
  return new Date(dueDate + 'T23:59:59') < new Date();
}
function priorityLabel(p){
  return { alta:'🔴 Alta', normal:'🔵 Normal', baja:'🟢 Baja' }[p] || '🔵 Normal';
}
function priorityChipClass(p){
  return { alta:'chip-alta', normal:'chip-normal', baja:'chip-baja' }[p] || 'chip-normal';
}
function escapeHtml(text){
  return String(text)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
function escapeJs(text){
  return String(text).replaceAll("'","\\'").replaceAll('\n',' ');
}

/**
 * Genera el HTML de los chips de etiquetas de una tarea.
 * @param {string[]} tags
 */
function renderTagChips(tags){
  if(!tags || !tags.length) return '';
  return tags.map(tag => {
    const ci = tagColorIndex(tag);
    return `<span class="tag-chip tag-${ci}">${escapeHtml(tag)}</span>`;
  }).join('');
}


/* ----------------------------------------------------------
   6. FILTROS Y ORDENACIÓN
   ---------------------------------------------------------- */
function getPending()   { return tasks.filter(t => !t.done); }
function getCompleted() { return tasks.filter(t =>  t.done); }

function sortTasksForDisplay(arr){
  return [...arr].sort((a,b)=>{
    if(a.highlighted && !b.highlighted) return -1;
    if(!a.highlighted && b.highlighted) return  1;
    return 0;
  });
}

/**
 * Aplica filtros de búsqueda, prioridad y etiqueta.
 * AMPLIACIÓN: Añade más filtros aquí siguiendo el mismo patrón.
 */
function applyFilters(arr){
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const prio   = document.getElementById('filterPriority')?.value || '';
  const tag    = document.getElementById('filterTag')?.value || '';
  return arr.filter(t => {
    const matchText = !search
      || t.text.toLowerCase().includes(search)
      || (t.notes || '').toLowerCase().includes(search)
      || t.subs.some(s => s.text.toLowerCase().includes(search));
    const matchPrio = !prio || t.priority === prio;
    const matchTag  = !tag  || (t.tags && t.tags.includes(tag));
    return matchText && matchPrio && matchTag;
  });
}

/**
 * Actualiza el <select> de filtro por etiqueta con todas las etiquetas
 * actualmente usadas en las tareas.
 */
function refreshTagFilter(){
  const sel = document.getElementById('filterTag');
  if(!sel) return;
  const current = sel.value;
  const allTags = [...new Set(tasks.flatMap(t => t.tags || []))].sort();
  sel.innerHTML = '<option value="">Todas las etiquetas</option>'
    + allTags.map(tag => `<option value="${escapeHtml(tag)}" ${tag===current?'selected':''}>${escapeHtml(tag)}</option>`).join('');
}


/* ----------------------------------------------------------
   7. ACCIONES SOBRE TAREAS
   ---------------------------------------------------------- */

function addTask(){
  const input = document.getElementById('taskInput');
  const v = input.value.trim();
  if(!v) return;
  tasks.push({
    id: Date.now(), text: v, done: false, highlighted: false,
    priority:         document.getElementById('defaultPriority').value || 'normal',
    dueDate:          document.getElementById('defaultDueDate').value  || null,
    notes:            '',
    tags:             [],
    createdAt:        new Date().toISOString(),
    completedAt:      null,
    estimatedMinutes: 0,
    remainingMinutes: 0,
    subs:             []
  });
  input.value = '';
  document.getElementById('defaultDueDate').value = '';
  save(); render();
}

/**
 * Alterna completado/pendiente.
 * Al completar guarda la fecha de completado (para stats).
 * Al reabrir la borra.
 */
function toggle(id){
  tasks = tasks.map(t => {
    if(t.id !== id) return t;
    const nowDone = !t.done;
    return {
      ...t,
      done:        nowDone,
      highlighted: nowDone ? false : t.highlighted,
      completedAt: nowDone ? new Date().toISOString() : null,
    };
  });
  save(); render();
}

function reopenTask(id){
  const idx = tasks.findIndex(t => t.id === id);
  if(idx===-1) return;
  tasks[idx].done = false;
  tasks[idx].completedAt = null;
  save(); render();
}

function delTask(id){
  if(!confirm('¿Eliminar esta tarea y sus subtareas?')) return;
  tasks = tasks.filter(t => t.id !== id);
  if(pom.taskId === id) closePomodoroWidget();
  expandedNotes.delete(id);
  save(); render();
}


/* ----------------------------------------------------------
   8. ACCIONES SOBRE SUBTAREAS
   ---------------------------------------------------------- */

function addSub(taskId){
  openEditModal('nueva-sub', taskId, null, '', 'normal', null, '', []);
}
function toggleSub(tid, sid){
  tasks = tasks.map(t =>
    t.id===tid ? { ...t, subs: t.subs.map(s => s.id===sid?{...s,done:!s.done}:s) } : t
  );
  save(); render();
}
function delSub(tid, sid){
  if(!confirm('¿Eliminar esta subtarea?')) return;
  tasks = tasks.map(t =>
    t.id===tid ? { ...t, subs: t.subs.filter(s => s.id!==sid) } : t
  );
  save(); render();
}


/* ----------------------------------------------------------
   9. DESTACAR / QUITAR DESTAQUE
   ---------------------------------------------------------- */

function highlightTask(id){
  const idx = tasks.findIndex(t => t.id===id);
  if(idx===-1) return;
  tasks = tasks.map(t => ({...t, highlighted:false}));
  const task = tasks[idx];
  task.highlighted = true;
  tasks.splice(idx, 1);
  const fp = tasks.findIndex(t => !t.done);
  if(fp===-1) tasks.unshift(task); else tasks.splice(fp, 0, task);
  save(); render();
}
function removeHighlight(id){
  tasks = tasks.map(t => t.id===id ? {...t, highlighted:false} : t);
  save(); render();
}


/* ----------------------------------------------------------
   10. REORDENAMIENTO
   ---------------------------------------------------------- */

function move(id, dir){
  const filtered = getPending();
  const ordered  = sortTasksForDisplay(applyFilters(filtered));
  const i = ordered.findIndex(t => t.id===id);
  const j = dir==='up' ? i-1 : i+1;
  if(i===-1 || j<0 || j>=ordered.length) return;
  const ai = tasks.findIndex(t => t.id===ordered[i].id);
  const bi = tasks.findIndex(t => t.id===ordered[j].id);
  [tasks[ai], tasks[bi]] = [tasks[bi], tasks[ai]];
  save(); render();
}


/* ----------------------------------------------------------
   11. MODAL DE EDICIÓN
   ---------------------------------------------------------- */

/**
 * Abre el modal de edición.
 * @param {'tarea'|'sub'|'nueva-sub'} type
 * @param {number}      taskId
 * @param {number|null} subId
 * @param {string}      currentText
 * @param {string}      currentPriority
 * @param {string|null} currentDueDate
 * @param {string}      currentNotes
 * @param {string[]}    currentTags
 */
function openEditModal(type, taskId, subId, currentText, currentPriority, currentDueDate, currentNotes, currentTags){
  editContext      = { type, taskId, subId };
  editSelectedTags = [...(currentTags || [])];

  const titles = {
    'tarea':     '✏️ Editar tarea',
    'sub':       '✏️ Editar subtarea',
    'nueva-sub': '➕ Nueva subtarea',
  };
  document.getElementById('editModalTitle').textContent = titles[type] || 'Editar';
  document.getElementById('editInput').value    = currentText    || '';
  document.getElementById('editPriority').value = currentPriority|| 'normal';
  document.getElementById('editDueDate').value  = currentDueDate || '';
  document.getElementById('editNotes').value    = currentNotes   || '';

  // Mostrar/ocultar campos que solo aplican a tareas principales
  const isMain = type === 'tarea' || type === 'nueva-tarea';
  const isTask = type === 'tarea';
  document.getElementById('editExtras').style.display    = isTask ? 'grid' : 'none';
  document.getElementById('editNotesField').style.display= isTask ? 'flex' : 'none';
  document.getElementById('editTagsField').style.display = isTask ? 'flex' : 'none';

  // Genera los botones de selección de etiquetas
  if(isTask){
    const sel = document.getElementById('tagSelector');
    sel.innerHTML = PREDEFINED_TAGS.map((tag, idx) => `
      <button type="button"
        class="tag-option tag-opt-${tag.colorIndex} ${editSelectedTags.includes(tag.label)?'selected':''}"
        onclick="toggleTagSelection('${escapeJs(tag.label)}')"
        id="tagOpt_${idx}">
        ${escapeHtml(tag.label)}
      </button>
    `).join('');
  }

  document.getElementById('editModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('editInput').focus(), 50);
}

/**
 * Alterna la selección de una etiqueta en el modal.
 * Máximo 3 etiquetas por tarea.
 * @param {string} label
 */
function toggleTagSelection(label){
  if(editSelectedTags.includes(label)){
    editSelectedTags = editSelectedTags.filter(t => t !== label);
  } else {
    if(editSelectedTags.length >= 3){
      alert('Máximo 3 etiquetas por tarea.'); return;
    }
    editSelectedTags.push(label);
  }
  // Actualiza visual de los botones
  PREDEFINED_TAGS.forEach((tag, idx) => {
    const btn = document.getElementById(`tagOpt_${idx}`);
    if(btn) btn.classList.toggle('selected', editSelectedTags.includes(tag.label));
  });
}

function closeEditModal(){
  document.getElementById('editModal').classList.add('hidden');
  editContext = { type:null, taskId:null, subId:null };
  editSelectedTags = [];
}
function closeEditModalOnOverlay(e){
  if(e.target === document.getElementById('editModal')) closeEditModal();
}

/**
 * Aplica los cambios del modal al estado.
 *
 * AMPLIACIÓN: Recoge aquí valores de nuevos campos del modal
 * (ej. document.getElementById('editTag').value)
 * y asígnalos a la tarea con el mismo patrón.
 */
function applyEdit(){
  const newText     = document.getElementById('editInput').value.trim();
  const newPriority = document.getElementById('editPriority').value;
  const newDueDate  = document.getElementById('editDueDate').value  || null;
  const newNotes    = document.getElementById('editNotes').value.trim();
  const newTags     = [...editSelectedTags];
  if(!newText) return;

  const { type, taskId, subId } = editContext;

  if(type === 'tarea'){
    tasks = tasks.map(t => t.id===taskId
      ? { ...t, text:newText, priority:newPriority, dueDate:newDueDate, notes:newNotes, tags:newTags }
      : t
    );
  } else if(type === 'sub'){
    tasks = tasks.map(t => t.id===taskId
      ? { ...t, subs: t.subs.map(s => s.id===subId ? {...s, text:newText} : s) }
      : t
    );
  } else if(type === 'nueva-sub'){
    tasks = tasks.map(t => t.id===taskId
      ? { ...t, subs: [...t.subs, { id:Date.now(), text:newText, done:false, createdAt:new Date().toISOString() }] }
      : t
    );
  }

  save(); closeEditModal(); render();
}


/* ----------------------------------------------------------
   12. NOTAS COLAPSABLES (toggle sin re-render)
   ---------------------------------------------------------- */

/**
 * Muestra u oculta el bloque de notas de una tarea.
 * Usa el Set `expandedNotes` para persistir el estado durante
 * la sesión sin necesidad de hacer un re-render completo.
 * @param {number} taskId
 */
function toggleNotes(taskId){
  if(expandedNotes.has(taskId)){
    expandedNotes.delete(taskId);
  } else {
    expandedNotes.add(taskId);
  }
  // Actualiza solo el bloque afectado, sin re-renderizar todo
  const block = document.getElementById(`notes-block-${taskId}`);
  const arrow = document.getElementById(`notes-arrow-${taskId}`);
  if(block){
    block.classList.toggle('hidden', !expandedNotes.has(taskId));
  }
  if(arrow){
    arrow.textContent = expandedNotes.has(taskId) ? '▼' : '▶';
  }
}


/* ----------------------------------------------------------
   13. POMODORO
   ---------------------------------------------------------- */
const pom = {
  taskId: null, mode: 'focus',
  totalSeconds: 25*60, remaining: 25*60,
  running: false, intervalId: null, sessions: 0,
};

function startPomodoro(taskId, taskText){
  if(pom.taskId && pom.taskId!==taskId && pom.running){
    if(!confirm('¿Cambiar el Pomodoro a esta tarea? Se reiniciará.')) return;
  }
  pom.taskId = taskId;
  resetPomodoro();
  document.getElementById('pomTaskName').textContent = taskText;
  document.getElementById('pomodoroWidget').classList.remove('hidden');
  // Carga sesiones de hoy desde localStorage
  const stats = loadPomStats();
  const today = new Date().toISOString().slice(0,10);
  pom.sessions = stats[today] || 0;
  renderPomodoroSessions();
}
function closePomodoroWidget(){
  pausePomodoroTimer(); pom.taskId = null;
  document.getElementById('pomodoroWidget').classList.add('hidden');
}
function setPomodoroMode(minutes, mode){
  pausePomodoroTimer();
  pom.mode = mode; pom.totalSeconds = minutes*60; pom.remaining = minutes*60;
  ['pomMode25','pomMode5','pomMode15'].forEach(id => document.getElementById(id).classList.remove('active'));
  const modeMap = {1500:'pomMode25', 300:'pomMode5', 900:'pomMode15'};
  const btn = modeMap[pom.totalSeconds];
  if(btn) document.getElementById(btn).classList.add('active');
  document.getElementById('pomRingFill').className = 'pom-ring-fill' + (mode==='rest'?' rest':'');
  renderPomodoroTime();
}
function togglePomodoro(){
  if(pom.running) pausePomodoroTimer(); else playPomodoroTimer();
}
function playPomodoroTimer(){
  if(pom.remaining<=0) return;
  pom.running = true;
  document.getElementById('pomPlayBtn').textContent = '⏸ Pausar';
  pom.intervalId = setInterval(pomodoroTick, 1000);
}
function pausePomodoroTimer(){
  pom.running = false;
  document.getElementById('pomPlayBtn').textContent = '▶ Iniciar';
  clearInterval(pom.intervalId);
}
function resetPomodoro(){
  pausePomodoroTimer(); pom.remaining = pom.totalSeconds; renderPomodoroTime();
}
function pomodoroTick(){
  if(pom.remaining<=0){
    pausePomodoroTimer(); pom.sessions++;
    savePomStats(1);      // Persiste en localStorage
    renderPomodoroSessions(); pomodoroFinished(); return;
  }
  pom.remaining--; renderPomodoroTime();
}
function renderPomodoroTime(){
  const m=Math.floor(pom.remaining/60), s=pom.remaining%60;
  document.getElementById('pomTime').textContent =
    String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  const pct = pom.remaining / pom.totalSeconds;
  const C = 2*Math.PI*48; // ≈ 301.59
  document.getElementById('pomRingFill').style.strokeDashoffset = C*(1-pct);
}
function renderPomodoroSessions(){
  document.getElementById('pomSessions').textContent = `Sesiones hoy: ${pom.sessions} 🍅`;
}
function pomodoroFinished(){
  const msg = pom.mode==='focus'
    ? '🍅 ¡Pomodoro completado! Tómate un descanso.'
    : '⚡ ¡Descanso terminado! Vuelve al trabajo.';
  if(Notification && Notification.permission==='granted'){
    new Notification('Gestor de Tareas', { body: msg });
  } else { alert(msg); }
  // AMPLIACIÓN: new Audio('campana.mp3').play();
}


/* ----------------------------------------------------------
   14. ESTADÍSTICAS
   ---------------------------------------------------------- */

/**
 * Muestra u oculta el panel de estadísticas.
 */
function toggleStats(){
  statsVisible = !statsVisible;
  const panel = document.getElementById('statsPanel');
  const btn   = document.getElementById('statsToggleBtn');
  panel.classList.toggle('hidden', !statsVisible);
  btn.classList.toggle('active', statsVisible);
  if(statsVisible) renderStats();
}

/**
 * Calcula y renderiza todas las estadísticas.
 *
 * Métricas calculadas:
 *   - Completadas hoy
 *   - Completadas esta semana (últimos 7 días)
 *   - Racha: días consecutivos con al menos 1 tarea completada
 *   - Sesiones Pomodoro completadas (por localStorage)
 *   - Tarea más antigua pendiente
 *   - Distribución semanal (gráfico de barras)
 *   - Top etiquetas usadas
 *
 * AMPLIACIÓN: Añade nuevas métricas calculando sobre `tasks`
 * y `pomStats` y añadiendo una nueva .stat-card al HTML.
 */
function renderStats(){
  const now   = new Date();
  const today = now.toISOString().slice(0,10);

  // --- Métricas de tareas completadas ---
  function dayKey(iso){ return iso ? iso.slice(0,10) : null; }

  const completedTasks = tasks.filter(t => t.done && t.completedAt);

  // Completadas hoy
  const todayCount = completedTasks.filter(t => dayKey(t.completedAt) === today).length;

  // Completadas esta semana (últimos 7 días)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate()-6);
  const weekCount = completedTasks.filter(t => new Date(t.completedAt) >= weekAgo).length;

  // Racha: días consecutivos con al menos 1 tarea completada (hacia atrás desde hoy)
  const completedDays = new Set(completedTasks.map(t => dayKey(t.completedAt)));
  let streak = 0;
  const d = new Date(today);
  while(completedDays.has(d.toISOString().slice(0,10))){
    streak++;
    d.setDate(d.getDate()-1);
  }

  // Tareas pendientes con prioridad alta
  const highPrio = tasks.filter(t => !t.done && t.priority === 'alta').length;

  // Tarea pendiente más antigua
  const oldestPending = tasks
    .filter(t => !t.done)
    .sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt))[0];

  // Total pendientes
  const totalPending = tasks.filter(t => !t.done).length;
  const totalDone    = tasks.filter(t => t.done).length;

  // --- Estadísticas de Pomodoro ---
  const pomStats = loadPomStats();
  const todayPom = pomStats[today] || 0;
  const weekPom  = Object.entries(pomStats)
    .filter(([k]) => new Date(k) >= weekAgo)
    .reduce((acc,[,v]) => acc+v, 0);

  // --- Distribución de los últimos 7 días ---
  const dayNames = ['D','L','M','X','J','V','S'];
  const weekDays = Array.from({length:7}, (_,i)=>{
    const dd = new Date(now);
    dd.setDate(dd.getDate()-(6-i));
    return {
      key:   dd.toISOString().slice(0,10),
      label: dayNames[dd.getDay()],
      isToday: dd.toISOString().slice(0,10) === today,
    };
  });
  const maxCount = Math.max(1, ...weekDays.map(d =>
    completedTasks.filter(t => dayKey(t.completedAt)===d.key).length
  ));

  // --- Top etiquetas ---
  const tagCounts = {};
  tasks.forEach(t => (t.tags||[]).forEach(tag => tagCounts[tag]=(tagCounts[tag]||0)+1));
  const topTags = Object.entries(tagCounts)
    .sort((a,b)=>b[1]-a[1]).slice(0,5);

  // --- Renderizado ---
  document.getElementById('statsContent').innerHTML = `
    <!-- Tarjetas de métricas -->
    <div class="stats-grid">
      <div class="stat-card accent-cyan">
        <div class="stat-value">${todayCount}</div>
        <div class="stat-label">Completadas hoy</div>
        <div class="stat-sub">${todayPom} 🍅 pomodoros</div>
      </div>
      <div class="stat-card accent-indigo">
        <div class="stat-value">${weekCount}</div>
        <div class="stat-label">Esta semana</div>
        <div class="stat-sub">${weekPom} 🍅 · ${Math.round(weekPom*25/60*10)/10}h de foco</div>
      </div>
      <div class="stat-card accent-emerald">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">Días de racha</div>
        <div class="stat-sub">${streak>=3?'🔥 ¡Sigue así!':streak===0?'Empieza hoy':'Vas bien'}</div>
      </div>
      <div class="stat-card accent-violet">
        <div class="stat-value">${totalPending}</div>
        <div class="stat-label">Pendientes</div>
        <div class="stat-sub">${totalDone} completadas en total</div>
      </div>
      <div class="stat-card accent-rose">
        <div class="stat-value">${highPrio}</div>
        <div class="stat-label">Alta prioridad</div>
        <div class="stat-sub">${highPrio>0?'Requieren atención':'Sin urgentes 👌'}</div>
      </div>
      <div class="stat-card accent-amber">
        <div class="stat-value">${weekPom}</div>
        <div class="stat-label">Pomodoros semana</div>
        <div class="stat-sub">≈ ${Math.round(weekPom*25/60*10)/10}h de foco real</div>
      </div>
    </div>

    <!-- Gráfico de barras semanal -->
    <div style="margin-bottom:12px;">
      <div class="small" style="margin-bottom:8px;font-weight:600;">Tareas completadas — últimos 7 días</div>
      <div class="week-chart">
        ${weekDays.map(d => {
          const count = completedTasks.filter(t => dayKey(t.completedAt)===d.key).length;
          const h = Math.max(4, Math.round((count/maxCount)*52));
          return `
            <div class="week-bar-wrap">
              <div class="week-bar-count">${count||''}</div>
              <div class="week-bar ${d.isToday?'today':''}" style="height:${h}px;" title="${count} el ${d.key}"></div>
              <div class="week-bar-label">${d.label}${d.isToday?' ●':''}</div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Tarea más antigua pendiente -->
    ${oldestPending ? `
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:var(--r);padding:10px 14px;font-size:13px;margin-bottom:12px;">
        <span class="small">⏳ Tarea pendiente más antigua (${elapsedFrom(oldestPending.createdAt)}): </span>
        <strong>${escapeHtml(oldestPending.text)}</strong>
      </div>
    ` : ''}

    <!-- Top etiquetas -->
    ${topTags.length ? `
      <div>
        <div class="small" style="margin-bottom:6px;font-weight:600;">Etiquetas más usadas</div>
        <div class="stats-tags">
          ${topTags.map(([tag, count]) => {
            const ci = tagColorIndex(tag);
            return `<span class="tag-chip tag-${ci}">${escapeHtml(tag)} <strong style="opacity:.7">${count}</strong></span>`;
          }).join('')}
        </div>
      </div>
    ` : '<div class="small">Aún no tienes etiquetas asignadas.</div>'}
  `;
}


/* ----------------------------------------------------------
   15. BACKUP
   ---------------------------------------------------------- */

function createBackup(showMessage=false){
  localStorage.setItem('tasks_backup', JSON.stringify({
    exportedAt: new Date().toISOString(), tasks
  }));
  backupJustDone = true;
  if(showMessage) alert('✅ Backup guardado en el navegador.');
}

function restoreBackup(){
  const raw = localStorage.getItem('tasks_backup');
  if(!raw){ alert('No hay ningún backup guardado.'); return; }
  try{
    const parsed = JSON.parse(raw);
    if(!parsed.tasks||!Array.isArray(parsed.tasks)){ alert('Backup no válido.'); return; }
    if(!confirm(`Restaurar backup del ${formatDate(parsed.exportedAt)}?\nSe perderán cambios actuales.`)) return;
    tasks = normalizeTasks(parsed.tasks); save(); render();
    alert('✅ Backup restaurado.');
  } catch(e){ alert('No se pudo leer el backup.'); }
}

/**
 * Exporta las tareas como fichero JSON descargable.
 * Se llama manualmente (botón) y también automáticamente al cerrar
 * la página si hay cambios sin guardar (auto-backup silencioso).
 * @param {boolean} silent - Si true, no muestra confirmación.
 */
function exportBackupFile(silent=false){
  const payload = { exportedAt: new Date().toISOString(), version: 3, tasks };
  const blob    = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `tareas_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  backupJustDone = true;
}

function importBackupFile(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const parsed = JSON.parse(e.target.result);
      if(!parsed.tasks||!Array.isArray(parsed.tasks)){ alert('Fichero no válido.'); return; }
      if(!confirm(`Importar ${parsed.tasks.length} tareas?\nSe reemplazarán las actuales.`)) return;
      tasks = normalizeTasks(parsed.tasks); save(); render();
      alert('✅ Tareas importadas.');
    } catch(err){ alert('Error al leer el fichero JSON.'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function showBackupWarning(){
  const box = document.getElementById('backupWarning');
  box.style.display = 'block';
  box.innerHTML = `
    ⚠️ <strong>Hay cambios sin exportar.</strong>
    <br><br>
    <button class="btn5" onclick="createBackup(true)">💾 Backup local</button>
    &nbsp;
    <button class="btn2" onclick="exportBackupFile()">⬇ Exportar fichero</button>
  `;
}


/* ----------------------------------------------------------
   16. RENDERIZADO
   ---------------------------------------------------------- */

function setView(v){
  view = v;
  document.getElementById('filterBar').style.display = v==='gestion' ? 'flex' : 'none';
  render();
}
function setTab(tab){ currentTab = tab; render(); }

function renderActiveButtons(){
  document.getElementById('viewGestionBtn').classList.toggle('view-active', view==='gestion');
  document.getElementById('viewArbolBtn').classList.toggle('view-active',   view==='arbol');
  document.getElementById('tabPendingBtn').classList.toggle('tab-active',   currentTab==='pending');
  document.getElementById('tabCompletedBtn').classList.toggle('tab-active', currentTab==='completed');
}

/**
 * Punto de entrada del renderizado.
 * Refresca también el filtro de tags y el panel de stats si está visible.
 */
function render(){
  renderActiveButtons();
  refreshTagFilter();
  if(statsVisible) renderStats();

  const list   = document.getElementById('list');
  const raw    = currentTab==='pending' ? sortTasksForDisplay(getPending()) : getCompleted();
  const source = view==='gestion' ? applyFilters(raw) : raw;

  if(!source.length){
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">${currentTab==='pending'?'🎉':'📭'}</div>
      ${currentTab==='pending'?'No hay tareas pendientes.':'No hay tareas completadas.'}
    </div>`;
    return;
  }
  list.className = 'list';
  if(view==='gestion') renderGestion(source, list);
  else                 renderArbol(source, list);
}

/* ---- Helpers de chips compartidos ---- */
function renderTaskChips(t){
  const overdue = isOverdue(t.dueDate);
  return `
    <span class="${t.done?'chip-done':'chip-pending'}">${t.done?'✅ Completada':'📌 Pendiente'}</span>
    <span class="${priorityChipClass(t.priority)}">${priorityLabel(t.priority)}</span>
    <span class="chip-date">📅 ${formatDate(t.createdAt)}</span>
    <span class="chip-age">${elapsedFrom(t.createdAt)}</span>
    ${t.dueDate?`<span class="${overdue?'chip-overdue':'chip-due'}">${overdue?'⚠️ Vencida:':'🗓 Límite:'} ${formatShortDate(t.dueDate)}</span>`:''}
    ${t.highlighted?'<span class="chip-highlight">⭐ Destacada</span>':''}
    ${renderTagChips(t.tags)}
  `;
}
function renderProgressBar(t){
  if(!t.subs.length) return '';
  const done = t.subs.filter(s=>s.done).length;
  const pct  = Math.round((done/t.subs.length)*100);
  return `<div class="progress-wrap">
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <span class="progress-label">${done}/${t.subs.length} subtareas</span>
  </div>`;
}

/**
 * Renderiza la vista GESTIÓN.
 * Incluye notas colapsables y etiquetas.
 */
function renderGestion(items, list){
  const isPending = currentTab==='pending';
  list.innerHTML = items.map((t, i) => {
    const hasNotes     = !!(t.notes && t.notes.trim());
    const notesVisible = expandedNotes.has(t.id);

    return `
    <div class="task ${t.highlighted?'highlighted':''} prio-${t.priority}">
      <div class="task-row">

        <!-- Flechas de orden -->
        <div class="order-buttons">
          ${isPending?`
            <button class="btn2" style="padding:6px 9px;" onclick="move(${t.id},'up')"   ${i===0            ?'disabled':''}>▲</button>
            <button class="btn2" style="padding:6px 9px;" onclick="move(${t.id},'down')" ${i===items.length-1?'disabled':''}>▼</button>
          `:''}
        </div>

        <input type="checkbox" ${t.done?'checked':''} onclick="toggle(${t.id})">
        <div class="task-number">${isPending?i+1:'✓'}</div>

        <!-- Título + meta -->
        <div class="task-main">
          <div class="task-title-line">
            <div class="task-title ${t.done?'completed':''}">${escapeHtml(t.text)}</div>
          </div>
          <div class="meta">${renderTaskChips(t)}</div>
          ${renderProgressBar(t)}

          <!-- Botón toggle notas (siempre visible si la tarea está pendiente) -->
          ${isPending?`
            <button class="notes-toggle-btn" onclick="toggleNotes(${t.id})">
              <span id="notes-arrow-${t.id}">${notesVisible?'▼':'▶'}</span>
              ${hasNotes?'Ver notas':'Añadir notas'}
            </button>
          `:''}
        </div>

        <!-- Botones de acción -->
        <div class="task-actions">
          ${isPending?`
            ${t.highlighted
              ?`<button class="btn7" onclick="removeHighlight(${t.id})">✕ Destaque</button>`
              :`<button class="btn6" onclick="highlightTask(${t.id})">⭐</button>`
            }
            <button class="btn8" onclick="startPomodoro(${t.id},'${escapeJs(t.text)}')">🍅</button>
            <button class="btn2" onclick="openEditModal('tarea',${t.id},null,'${escapeJs(t.text)}','${t.priority}','${t.dueDate||''}','${escapeJs(t.notes||'')}',${JSON.stringify(t.tags||[])})">✏️</button>
            <button class="btn3" onclick="toggle(${t.id})">✅</button>
            <button class="btn2" onclick="addSub(${t.id})">+Sub</button>
          `:`
            <button class="btn3" onclick="reopenTask(${t.id})">↩ Reabrir</button>
          `}
          <button class="btn4" onclick="delTask(${t.id})">🗑</button>
        </div>

      </div><!-- /task-row -->

      <!-- Bloque de notas colapsable -->
      <div id="notes-block-${t.id}" class="notes-block ${notesVisible?'':'hidden'}">
        ${hasNotes
          ? escapeHtml(t.notes)
          : '<span class="notes-block-empty">Sin notas. Haz clic en ✏️ para añadir contexto.</span>'
        }
        <button class="notes-edit-btn"
          onclick="openEditModal('tarea',${t.id},null,'${escapeJs(t.text)}','${t.priority}','${t.dueDate||''}','${escapeJs(t.notes||'')}',${JSON.stringify(t.tags||[])})">
          ✏️ Editar
        </button>
      </div>

      <!-- Subtareas -->
      ${t.subs.length?`
        <div class="subs">
          ${t.subs.map(s=>`
            <div class="sub">
              <input type="checkbox" ${s.done?'checked':''} onclick="toggleSub(${t.id},${s.id})">
              <div>
                <div class="sub-text ${s.done?'completed':''}">${escapeHtml(s.text)}</div>
                <div class="small">Añadida ${formatDate(s.createdAt)} · ${elapsedFrom(s.createdAt)}</div>
              </div>
              <div class="sub-actions">
                <button class="btn2" onclick="openEditModal('sub',${t.id},${s.id},'${escapeJs(s.text)}','normal',null,'',${JSON.stringify([])})">✏️</button>
                <button class="btn3" onclick="toggleSub(${t.id},${s.id})">${s.done?'↩':'✅'}</button>
                <button class="btn4" onclick="delSub(${t.id},${s.id})">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      `:''}

    </div><!-- /task -->
  `}).join('');
}

/**
 * Renderiza la vista FOCO con jerarquía progresiva.
 * rank-1=tarea 1, rank-2=tareas 2-3, rank-3=4-7, rank-4=8+
 */
function renderArbol(items, list){
  const isPending = currentTab==='pending';
  function rankClass(i){ return i===0?'rank-1':i<=2?'rank-2':i<=6?'rank-3':'rank-4'; }

  list.innerHTML = `<div class="global-list">` + items.map((t,i)=>{
    const rank = rankClass(i);
    if(rank==='rank-4') return `
      <div class="global-task ${rank} ${t.highlighted?'highlighted':''} prio-${t.priority}">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:var(--muted);font-size:11px;font-weight:700;min-width:18px;">${i+1}</span>
          <span class="g-title ${t.done?'completed':''}">${escapeHtml(t.text)}</span>
          ${t.tags?.length?`<span style="display:flex;gap:4px;">${renderTagChips(t.tags)}</span>`:''}
          ${t.subs.length?`<span style="font-size:10px;color:var(--muted);">(${t.subs.filter(s=>s.done).length}/${t.subs.length})</span>`:''}
        </div>
      </div>`;

    return `
      <div class="global-task ${rank} ${t.highlighted?'highlighted':''} prio-${t.priority}">
        ${rank==='rank-1'?`<div class="g-number">${i+1}</div>`:''}
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          ${rank!=='rank-1'?`<span style="color:var(--muted);font-family:var(--font-display);font-weight:700;min-width:22px;">${i+1}</span>`:''}
          <input type="checkbox" ${t.done?'checked':''} onclick="toggle(${t.id})">
          <span class="g-title ${t.done?'completed':''}">${escapeHtml(t.text)}</span>
          ${t.highlighted?'<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(168,85,247,.2);color:var(--violet2);border:1px solid var(--violet);">⭐</span>':''}
        </div>
        <div class="g-meta">
          <span class="${priorityChipClass(t.priority)}">${priorityLabel(t.priority)}</span>
          ${t.dueDate?`<span class="${isOverdue(t.dueDate)?'chip-overdue':'chip-due'}">${isOverdue(t.dueDate)?'⚠️':'🗓'} ${formatShortDate(t.dueDate)}</span>`:''}
          ${t.tags?.length?renderTagChips(t.tags):''}
          ${t.subs.length?`<span>${t.subs.filter(s=>s.done).length}/${t.subs.length} sub</span>`:''}
          <span>${elapsedFrom(t.createdAt)}</span>
          ${t.notes?'<span title="Tiene notas">📝</span>':''}
        </div>
        ${renderProgressBar(t)}
        ${isPending?`
          <div class="g-actions">
            ${t.highlighted
              ?`<button class="btn7" onclick="removeHighlight(${t.id})">✕ Destaque</button>`
              :`<button class="btn6" onclick="highlightTask(${t.id})">⭐ Destacar</button>`}
            <button class="btn8" onclick="startPomodoro(${t.id},'${escapeJs(t.text)}')">🍅 Foco</button>
            <button class="btn3" onclick="toggle(${t.id})">✅ Completar</button>
            <button class="btn4" onclick="delTask(${t.id})">🗑</button>
          </div>
        `:`
          <div class="g-actions">
            <button class="btn3" onclick="reopenTask(${t.id})">↩ Reabrir</button>
            <button class="btn4" onclick="delTask(${t.id})">🗑</button>
          </div>
        `}
        ${t.subs.length&&rank!=='rank-4'?`
          <div style="margin-top:8px;margin-left:${rank==='rank-1'?'28':'22'}px;display:flex;flex-direction:column;gap:4px;">
            ${t.subs.map(s=>`
              <div style="display:flex;align-items:center;gap:8px;font-size:${rank==='rank-1'?'13':'12'}px;opacity:.85;">
                <input type="checkbox" ${s.done?'checked':''} onclick="toggleSub(${t.id},${s.id})">
                <span class="${s.done?'completed':''}">
                  <span style="color:var(--muted);">└</span> ${escapeHtml(s.text)}
                </span>
              </div>
            `).join('')}
          </div>
        `:''}
      </div>`;
  }).join('') + `</div>`;
}


/* ----------------------------------------------------------
   17. INICIALIZACIÓN
   ---------------------------------------------------------- */

/**
 * Auto-backup al cerrar la pestaña/ventana.
 * Si hay cambios sin exportar a fichero (backupJustDone===false),
 * descarga automáticamente el JSON.
 * El navegador también mostrará su propio diálogo de confirmación.
 *
 * NOTA: Los navegadores modernos bloquean descargas automáticas
 * en el evento beforeunload por seguridad. El fichero se descargará
 * si el usuario confirma que quiere salir.
 */
window.addEventListener('beforeunload', function(e){
  if(!backupJustDone && tasks.length > 0){
    showBackupWarning();
    // Intenta exportar automáticamente
    try { exportBackupFile(true); } catch(err){}
    e.preventDefault();
    e.returnValue = '¿Salir? Se intentó exportar el backup automáticamente.';
  }
});

/** Escape cierra el modal. */
window.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeEditModal();
});

/** Permiso de notificaciones para el Pomodoro. */
if(Notification && Notification.permission === 'default'){
  Notification.requestPermission();
}

/** Re-render automático cada minuto (actualiza antigüedades). */
setInterval(render, 60000);

/** Render inicial. */
render();

