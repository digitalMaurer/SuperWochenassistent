import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, importTasks, loadTasks, saveTasks } from '../utils/tasksStorage';
import TaskCard from '../components/TaskCard';
import TaskFilter from '../components/TaskFilter';

function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');
  const [view, setView] = useState('gestion');
  const [filter, setFilter] = useState('all');
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  const aiPrompt = `Por favor, devuelve únicamente un JSON con los campos:\n- text\n- priority (alta, normal, baja)\n- dueDate (YYYY-MM-DD opcional)\n- notes opcionales\n- estimatedMinutes\n- remainingMinutes\n- subs (arreglo de subtareas con text y optional done booleano)\n\nEjemplo de respuesta esperada:\n[{\n  "text": "Escribir informe de ventas",\n  "priority": "normal",\n  "dueDate": "2026-04-15",\n  "notes": "Incluir gráficos y conclusiones.",\n  "estimatedMinutes": 120,\n  "remainingMinutes": 120,\n  "subs": [\n    { "text": "Reunir datos" },\n    { "text": "Redactar borrador" }\n  ]\n}]`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopyFeedback('Copiado al portapapeles.');
    } catch (error) {
      setCopyFeedback('No se pudo copiar automáticamente. Selecciona y copia manualmente.');
    }
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const handleSave = (newTasks) => {
    const normalized = saveTasks(newTasks);
    setTasks(normalized);
  };

  const getPendingTasks = (sourceTasks) =>
    sourceTasks
      .filter((task) => !task.done)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt));

  const getCompletedTasks = (sourceTasks) =>
    sourceTasks
      .filter((task) => task.done)
      .slice()
      .sort((a, b) =>
        (a.completedAt || '').localeCompare(b.completedAt || '') ||
        a.createdAt.localeCompare(b.createdAt)
      );

  const getNextPendingOrder = (sourceTasks) =>
    sourceTasks.reduce(
      (max, task) => Math.max(max, task.done ? max : typeof task.order === 'number' ? task.order : 0),
      0
    ) + 1;

  const reorderPendingTasks = (sourceTasks, reorderedPending) => {
    const pendingById = new Map(reorderedPending.map((task) => [task.id, task]));
    return sourceTasks.map((task) => (pendingById.has(task.id) ? pendingById.get(task.id) : task));
  };

  const movePendingTask = (taskId, direction) => {
    const pending = getPendingTasks(tasks);
    const index = pending.findIndex((task) => task.id === taskId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pending.length) return;

    const reordered = [...pending];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const normalized = reordered.map((task, orderIndex) => ({
      ...task,
      order: orderIndex + 1,
    }));
    handleSave(reorderPendingTasks(tasks, normalized));
  };

  const moveTaskToPendingTop = (sourceTasks, taskId) => {
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
  };

  const handleAdd = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = createTask(trimmed, getNextPendingOrder(tasks));
    handleSave([...tasks, newTask]);
    setText('');
    setView('gestion');
  };

  const handleToggle = (taskId) => {
    const updated = tasks.map((task) => {
      if (task.id !== taskId) return task;

      const nextDone = !task.done;
      return {
        ...task,
        done: nextDone,
        completedAt: nextDone ? new Date().toISOString() : null,
        order: nextDone ? task.order : getNextPendingOrder(tasks),
      };
    });

    handleSave(updated);
  };

  const handleDelete = (taskId) => {
    handleSave(tasks.filter((task) => task.id !== taskId));
  };

  const handleHighlight = (taskId) => {
    let updated = tasks.map((task) =>
      task.id === taskId ? { ...task, highlighted: !task.highlighted } : task
    );

    const toggled = updated.find((task) => task.id === taskId);
    if (toggled && toggled.highlighted && !toggled.done) {
      updated = moveTaskToPendingTop(updated, taskId);
    }

    handleSave(updated);
  };

  const handleSaveEdit = (taskId, patch) => {
    const updated = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...patch,
          }
        : task
    );
    handleSave(updated);
  };

  const handlePlanTask = (taskId) => {
    navigate(`/semana?taskId=${taskId}`);
  };

  const validateImportObject = (payload) => {
    const allowedPriorities = ['alta', 'normal', 'baja'];
    if (!payload || typeof payload !== 'object') {
      return 'El JSON debe contener un objeto o un arreglo de objetos.';
    }

    const validateTask = (task) => {
      if (!task.text || typeof task.text !== 'string') {
        return 'Cada tarea debe tener un campo "text" de tipo cadena.';
      }
      if (task.priority && !allowedPriorities.includes(task.priority)) {
        return 'La prioridad debe ser "alta", "normal" o "baja".';
      }
      if (task.dueDate && typeof task.dueDate !== 'string') {
        return 'La fecha límite debe ser una cadena en formato YYYY-MM-DD.';
      }
      if (task.estimatedMinutes != null && typeof task.estimatedMinutes !== 'number') {
        return 'estimatedMinutes debe ser un número.';
      }
      if (task.remainingMinutes != null && typeof task.remainingMinutes !== 'number') {
        return 'remainingMinutes debe ser un número.';
      }
      if (task.subs != null) {
        if (!Array.isArray(task.subs)) {
          return 'subs debe ser un arreglo de subtareas.';
        }
        for (const sub of task.subs) {
          if (!sub.text || typeof sub.text !== 'string') {
            return 'Cada subtarea debe tener un campo "text" de tipo cadena.';
          }
          if (sub.done != null && typeof sub.done !== 'boolean') {
            return 'El campo done de subtarea debe ser booleano.';
          }
        }
      }
      return null;
    };

    if (Array.isArray(payload)) {
      for (const task of payload) {
        const error = validateTask(task);
        if (error) return error;
      }
      return null;
    }
    return validateTask(payload);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportFeedback({ type: 'error', message: 'Pega un JSON válido para importar.' });
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      const validationError = validateImportObject(parsed);
      if (validationError) {
        setImportFeedback({ type: 'error', message: validationError });
        return;
      }

      const imported = importTasks(parsed);
      const merged = [...imported, ...tasks];
      const normalized = saveTasks(merged);
      setTasks(normalized);
      setImportText('');
      setImportFeedback({ type: 'success', message: `${imported.length} tarea(s) importada(s) correctamente.` });
      setView('gestion');
    } catch (error) {
      setImportFeedback({ type: 'error', message: 'JSON inválido. Revisa la sintaxis.' });
    }
  };

  const handleAddSubtask = (taskId, subtaskText) => {
    const updated = tasks.map((task) =>
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
    handleSave(updated);
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    const updated = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subs: task.subs.map((sub) =>
              sub.id === subtaskId ? { ...sub, done: !sub.done } : sub
            ),
          }
        : task
    );
    handleSave(updated);
  };

  const handleDeleteSubtask = (taskId, subtaskId) => {
    const updated = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subs: task.subs.filter((sub) => sub.id !== subtaskId),
          }
        : task
    );
    handleSave(updated);
  };

  const pendingTasks = useMemo(() => getPendingTasks(tasks), [tasks]);
  const completedTasks = useMemo(() => getCompletedTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'pending') return pendingTasks;
    if (filter === 'completed') return completedTasks;
    return [...pendingTasks, ...completedTasks];
  }, [pendingTasks, completedTasks, filter]);

  const focusTask = useMemo(() => {
    const highlighted = pendingTasks.find((task) => task.highlighted);
    return highlighted || pendingTasks[0] || null;
  }, [pendingTasks]);

  const pendingPositionById = useMemo(() => {
    return pendingTasks.reduce((map, task, index) => {
      map[task.id] = index + 1;
      return map;
    }, {});
  }, [pendingTasks]);

  const visibleTasks = useMemo(() => {
    if (view === 'foco') {
      return focusTask ? [focusTask] : [];
    }
    return filteredTasks;
  }, [filteredTasks, view, focusTask]);

  return (
    <section className="page-panel">
      <div className="tasks-header">
        <div>
          <h2>Tareas</h2>
          <p>Gestión de tareas con subtareas y tiempo estimado/restante.</p>
        </div>
        <div className="view-controls">
          <div className="view-tabs">
            <button
              type="button"
              className={`tab-button ${view === 'gestion' ? 'active' : ''}`}
              onClick={() => setView('gestion')}
            >
              Gestión
            </button>
            <button
              type="button"
              className={`tab-button ${view === 'foco' ? 'active' : ''}`}
              onClick={() => setView('foco')}
            >
              Foco
            </button>
          </div>
          {view === 'gestion' && <TaskFilter value={filter} onChange={setFilter} />}
        </div>
      </div>

      {view === 'gestion' && (
        <>
          <form className="task-form" onSubmit={handleAdd}>
            <input
              className="task-input"
              placeholder="Añadir nueva tarea..."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <button className="task-button" type="submit">
              Añadir
            </button>
          </form>

          <div className="management-info">
            <p>Modo gestión: puedes añadir tareas, importar JSON y usar el prompt IA.</p>
          </div>
        </>
      )}

      {view === 'foco' ? (
        focusTask ? (
          <div className="focus-summary">
            <h3>Tarea en foco</h3>
            <p>
              {focusTask.highlighted
                ? 'Mostrando la tarea destacada pendiente.'
                : 'Mostrando la primera tarea pendiente.'}
            </p>
            <p className="focus-note">Para gestionar o añadir tareas, cambia al modo Gestión.</p>
          </div>
        ) : (
          <div className="focus-empty">
            <p>No hay tareas pendientes para enfocar.</p>
            <p className="focus-note">Cambia al modo Gestión para ver todas tus tareas y crear nuevas.</p>
          </div>
        )
      ) : null}

      <div className="task-list">
        {visibleTasks.map((task) => {
          const position = pendingPositionById[task.id];
          return (
            <TaskCard
              key={task.id}
              task={task}
              position={position}
              canMoveUp={position != null && position > 1}
              canMoveDown={position != null && position < pendingTasks.length}
              onMoveUp={movePendingTask}
              onMoveDown={movePendingTask}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onHighlight={handleHighlight}
              onPlan={handlePlanTask}
              onSaveEdit={handleSaveEdit}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          );
        })}
      </div>

      {view === 'gestion' && (
        <>
          <div className="ai-prompt-section">
            <h3>Generar tarea con ayuda de IA</h3>
            <p>Copiar este prompt y pegarlo en tu IA externa para obtener un JSON listo para importar.</p>
            <textarea
              className="import-textarea"
              value={aiPrompt}
              readOnly
              rows={10}
            />
            <div className="import-actions">
              <button className="task-button" type="button" onClick={handleCopyPrompt}>
                Copiar prompt
              </button>
              {copyFeedback && (
                <div className="import-feedback success">
                  {copyFeedback}
                </div>
              )}
            </div>
          </div>

          <div className="import-section">
        <h3>Importar tareas desde JSON</h3>
        <p>Pega aquí el JSON de tareas para añadirlas automáticamente.</p>
        <textarea
          className="import-textarea"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder='Ejemplo: [{ "text": "Estudiar React", "priority": "alta", "dueDate": "2026-04-10", "notes": "Repasar hooks", "estimatedMinutes": 90, "remainingMinutes": 90, "subs": [{ "text": "Leer docs" }] } ]'
          rows={8}
        />
          <div className="import-actions">
            <button className="task-button" type="button" onClick={handleImport}>
              Importar JSON
            </button>
            {importFeedback && (
              <div className={`import-feedback ${importFeedback.type}`}>
                {importFeedback.message}
              </div>
            )}
          </div>

              <div className="import-template">
              <strong>Ejemplo mínimo válido:</strong>
              <pre>{`[
  {
    "text": "Escribir informe",
    "priority": "normal",
    "dueDate": "2026-04-12",
    "notes": "Incluir resultados y conclusiones.",
    "estimatedMinutes": 120,
    "remainingMinutes": 120,
    "subs": [
      { "text": "Buscar datos" },
      { "text": "Escribir borrador" }
    ]
  }
]`}</pre>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default TasksPage;
