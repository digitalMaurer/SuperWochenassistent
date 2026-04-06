import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importTasks, loadTasks, saveTasks } from '../utils/tasksStorage';
import {
  getPendingTasks,
  getCompletedTasks,
  getFilteredTasks,
  getFocusTask,
  getPendingPositionById,
} from '../utils/tasksSelectors';
import {
  addTask,
  toggleTaskDone,
  deleteTask,
  highlightTask,
  saveEditTask,
  movePendingTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from '../utils/tasksActions';
import TasksToolbar from '../components/tasks/TasksToolbar';
import TasksManagementView from '../components/tasks/TasksManagementView';
import TasksFocusView from '../components/tasks/TasksFocusView';
import TaskList from '../components/tasks/TaskList';
import AiPromptPanel from '../components/tasks/AiPromptPanel';
import JsonImportPanel from '../components/tasks/JsonImportPanel';

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

  const handleAdd = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    handleSave(addTask(tasks, trimmed));
    setText('');
    setView('gestion');
  };

  const handleToggle = (taskId) => {
    handleSave(toggleTaskDone(tasks, taskId));
  };

  const handleDelete = (taskId) => {
    handleSave(deleteTask(tasks, taskId));
  };

  const handleHighlight = (taskId) => {
    handleSave(highlightTask(tasks, taskId));
  };

  const handleSaveEdit = (taskId, patch) => {
    handleSave(saveEditTask(tasks, taskId, patch));
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
    handleSave(addSubtask(tasks, taskId, subtaskText));
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    handleSave(toggleSubtask(tasks, taskId, subtaskId));
  };

  const handleDeleteSubtask = (taskId, subtaskId) => {
    handleSave(deleteSubtask(tasks, taskId, subtaskId));
  };

  const pendingTasks = useMemo(() => getPendingTasks(tasks), [tasks]);
  const completedTasks = useMemo(() => getCompletedTasks(tasks), [tasks]);

  const filteredTasks = useMemo(
    () => getFilteredTasks(pendingTasks, completedTasks, filter),
    [pendingTasks, completedTasks, filter]
  );

  const focusTask = useMemo(() => getFocusTask(pendingTasks), [pendingTasks]);
  const pendingPositionById = useMemo(() => getPendingPositionById(pendingTasks), [pendingTasks]);

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
        <TasksToolbar
          view={view}
          onChangeView={setView}
          filter={filter}
          onChangeFilter={setFilter}
        />
      </div>

      {view === 'gestion' && (
        <TasksManagementView taskText={text} onTaskTextChange={setText} onTaskAdd={handleAdd} />
      )}

      {view === 'foco' && <TasksFocusView focusTask={focusTask} />}

      <TaskList
        tasks={visibleTasks}
        pendingTasksLength={pendingTasks.length}
        pendingPositionById={pendingPositionById}
        onMoveUp={(id) => handleSave(movePendingTask(tasks, id, 'up'))}
        onMoveDown={(id) => handleSave(movePendingTask(tasks, id, 'down'))}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onHighlight={handleHighlight}
        onPlan={handlePlanTask}
        onSaveEdit={handleSaveEdit}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      {view === 'gestion' && (
        <>
          <AiPromptPanel prompt={aiPrompt} onCopy={handleCopyPrompt} copyFeedback={copyFeedback} />
          <JsonImportPanel
            importText={importText}
            onImportTextChange={setImportText}
            onImport={handleImport}
            importFeedback={importFeedback}
          />
        </>
      )}
    </section>
  );
}

export default TasksPage;
