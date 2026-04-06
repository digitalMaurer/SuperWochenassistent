import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSchedule } from '../utils/weekScheduleStorage';
import { formatDateKey, formatMonthLabel, getMonthGrid } from '../utils/dateHelpers';

function MonthPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedule, setSchedule] = useState({ version: 1, slots: {} });
  const navigate = useNavigate();

  useEffect(() => {
    setSchedule(loadSchedule());
  }, []);

  const monthLabel = useMemo(() => formatMonthLabel(currentMonth), [currentMonth]);
  const monthGrid = useMemo(
    () => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const assignmentCounts = useMemo(() => {
    const counts = {};
    Object.entries(schedule.slots).forEach(([key, assignments]) => {
      const dateKey = key.slice(0, 10);
      counts[dateKey] = (counts[dateKey] || 0) + assignments.length;
    });
    return counts;
  }, [schedule]);

  const changeMonth = (delta) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + delta);
    setCurrentMonth(next);
  };

  const handleDayClick = (day) => {
    const dateKey = formatDateKey(day);
    navigate(`/semana?date=${dateKey}`);
  };

  return (
    <section className="page-panel month-page">
      <div className="month-toolbar">
        <div>
          <h2>Mes</h2>
          <p>{monthLabel}</p>
        </div>
        <div className="month-actions">
          <button type="button" onClick={() => changeMonth(-1)}>
            Mes anterior
          </button>
          <button type="button" onClick={() => setCurrentMonth(new Date())}>
            Hoy
          </button>
          <button type="button" onClick={() => changeMonth(1)}>
            Mes siguiente
          </button>
          <button type="button" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      <div className="month-grid">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
          <div key={label} className="month-grid-header">
            {label}
          </div>
        ))}

        {monthGrid.map((week, wi) =>
          week.map((day) => {
            const dateKey = formatDateKey(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const count = assignmentCounts[dateKey] || 0;
            return (
              <button
                key={`${wi}-${dateKey}`}
                type="button"
                className={`month-cell ${isCurrentMonth ? '' : 'month-cell-muted'}`}
                onClick={() => handleDayClick(day)}
              >
                <span className="month-day-number">{day.getDate()}</span>
                <span className="month-day-count">{count > 0 ? `${count} asign.` : 'Libre'}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MonthPage;
