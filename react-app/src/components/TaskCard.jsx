import { useEffect, useState } from 'react';

function TaskCard({
  task,
  onToggle,
  onDelete,
  onHighlight,
  onSaveEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [form, setForm] = useState({
    text: task.text,
    priority: task.priority,
    dueDate: task.dueDate || '',
    estimatedMinutes: task.estimatedMinutes || 0,
    remainingMinutes: task.remainingMinutes || 0,
  });

  useEffect(() => {
    if (!isEditing) {
      setForm({
        text: task.text,
        priority: task.priority,
        dueDate: task.dueDate || '',
        estimatedMinutes: task.estimatedMinutes || 0,
        remainingMinutes: task.remainingMinutes || 0,
      });
    }
  }, [isEditing, task]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveEdit(task.id, {
      text: form.text.trim() || task.text,
      priority: form.priority,
      dueDate: form.dueDate || null,
      estimatedMinutes: Number(form.estimatedMinutes) || 0,
      remainingMinutes: Number(form.remainingMinutes) || 0,
    });
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    onAddSubtask(task.id, trimmed);
    setNewSubtaskText('');
  };

  return (
    <article className={`task-card ${task.done ? 'completed' : ''} ${task.highlighted ? 'highlighted' : ''}`}>
      <div className="task-card-main">
        <div className="task-card-header">
          <div>
            <h3 className="task-title">{task.text || 'Sin título'}</h3>
            <div className="task-meta">
              <span className="meta-pill">{task.priority}</span>
              {task.dueDate && <span className="meta-pill">Due: {task.dueDate}</span>}
              <span className="meta-pill">Est: {task.estimatedMinutes}m</span>
              <span className="meta-pill">Rest: {task.remainingMinutes}m</span>
            </div>
          </div>
          {task.highlighted && <span className="task-highlight">Destacada</span>}
        </div>

        {isEditing ? (
          <div className="task-edit-grid">
            <label>
              Texto
              <input
                value={form.text}
                onChange={(e) => handleChange('text', e.target.value)}
              />
            </label>
            <label>
              Prioridad
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <label>
              Fecha límite
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </label>
            <label>
              Estimado (min)
              <input
                type="number"
                min="0"
                value={form.estimatedMinutes}
                onChange={(e) => handleChange('estimatedMinutes', e.target.value)}
              />
            </label>
            <label>
              Restante (min)
              <input
                type="number"
                min="0"
                value={form.remainingMinutes}
                onChange={(e) => handleChange('remainingMinutes', e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div className="task-details">
            <p className="task-notes">{task.notes || 'Sin notas adicionales.'}</p>
            <p className="task-subtask-summary">Subtareas: {task.subs.length}</p>
          </div>
        )}

        <div className="subtask-section">
          <div className="subtask-input-row">
            <input
              type="text"
              placeholder="Añadir subtarea..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
            />
            <button type="button" className="subtask-add" onClick={handleAddSubtask}>
              Añadir
            </button>
          </div>
          {task.subs.length > 0 && (
            <ul className="subtask-list">
              {task.subs.map((sub) => (
                <li key={sub.id} className={`subtask-item ${sub.done ? 'completed' : ''}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={() => onToggleSubtask(task.id, sub.id)}
                    />
                    <span>{sub.text || 'Sin título'}</span>
                  </label>
                  <button className="subtask-delete" type="button" onClick={() => onDeleteSubtask(task.id, sub.id)}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button className="task-action" type="button" onClick={() => onToggle(task.id)}>
          {task.done ? 'Reabrir' : 'Completar'}
        </button>
        <button className="task-action" type="button" onClick={() => onHighlight(task.id)}>
          {task.highlighted ? 'Quitar destaque' : 'Destacar'}
        </button>
        <button className="task-action" type="button" onClick={() => setIsEditing((prev) => !prev)}>
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
        <button className="task-action danger" type="button" onClick={() => onDelete(task.id)}>
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
