import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createAssignment, loadSchedule, saveSchedule } from '../utils/weekScheduleStorage';
import { getWeekDates, formatDateKey, formatWeekRange } from '../utils/dateHelpers';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function slotKey(dateKey, hour) {
  return `${dateKey}-${String(hour).padStart(2, '0')}`;
}

function WeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState({ version: 1, slots: {} });
  const [selectedKey, setSelectedKey] = useState(null);
  const [assignmentText, setAssignmentText] = useState('');
  const location = useLocation();

  useEffect(() => {
    setSchedule(loadSchedule());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
        setSelectedKey(null);
      }
    }
  }, [location.search]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekLabel = useMemo(() => formatWeekRange(weekDates), [weekDates]);

  const getSlotAssignments = (key) => schedule.slots[key] || [];

  const handleSaveSchedule = (newSchedule) => {
    const normalized = saveSchedule(newSchedule);
    setSchedule(normalized);
  };

  const handleAddAssignment = () => {
    if (!selectedKey || !assignmentText.trim()) return;
    const separatorIndex = selectedKey.lastIndexOf('-');
    const dateKey = selectedKey.slice(0, separatorIndex);
    const hour = Number(selectedKey.slice(separatorIndex + 1));
    const newAssignment = createAssignment(assignmentText, dateKey, hour);
    const updatedSlots = {
      ...schedule.slots,
      [selectedKey]: [...getSlotAssignments(selectedKey), newAssignment],
    };
    handleSaveSchedule({ ...schedule, slots: updatedSlots });
    setAssignmentText('');
  };

  const handleRemoveAssignment = (key, assignmentId) => {
    const updatedSlots = {
      ...schedule.slots,
      [key]: getSlotAssignments(key).filter((item) => item.id !== assignmentId),
    };
    handleSaveSchedule({ ...schedule, slots: updatedSlots });
  };

  const changeWeek = (deltaWeeks) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + deltaWeeks * 7);
    setCurrentDate(nextDate);
    setSelectedKey(null);
  };

  return (
    <section className="page-panel week-page">
      <div className="week-toolbar">
        <div>
          <h2>Semana</h2>
          <p>{weekLabel}</p>
        </div>
        <div className="week-actions">
          <button type="button" onClick={() => changeWeek(-1)}>
            Semana anterior
          </button>
          <button type="button" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </button>
          <button type="button" onClick={() => changeWeek(1)}>
            Semana siguiente
          </button>
        </div>
      </div>

      <div className="week-grid">
        <div className="grid-header" />
        {weekDates.map((day) => (
          <div key={formatDateKey(day)} className="grid-header day-cell">
            <div>{day.toLocaleDateString('es-ES', { weekday: 'long' })}</div>
            <div>{formatDateKey(day)}</div>
          </div>
        ))}

        {HOURS.map((hour) => (
          <div key={`row-${hour}`} className="grid-row">
            <div className="grid-hour">{String(hour).padStart(2, '0')}:00</div>
            {weekDates.map((day) => {
              const dateKey = formatDateKey(day);
              const key = slotKey(dateKey, hour);
              const items = getSlotAssignments(key);
              const isSelected = selectedKey === key;

              return (
                <div
                  key={key}
                  className={`grid-slot ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  {items.length > 0 ? (
                    <div className="slot-stack">
                      {items.map((item) => (
                        <div key={item.id} className="assignment-pill">
                          <span>{item.text}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(key, item.id); }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="slot-empty">Clic para crear</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="week-footer">
        <div className="selected-slot-box">
          <strong>Slot seleccionado</strong>
          <div>{selectedKey || 'Ninguno'}</div>
        </div>
        <div className="slot-entry">
          <input
            type="text"
            value={assignmentText}
            onChange={(e) => setAssignmentText(e.target.value)}
            placeholder="Texto de la asignación"
          />
          <button type="button" onClick={handleAddAssignment}>
            Guardar asignación
          </button>
        </div>
      </div>
    </section>
  );
}

export default WeekPage;
