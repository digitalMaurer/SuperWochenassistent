import { forwardRef } from 'react';
import { formatDateKey, formatEuropeanDate } from '../utils/dateHelpers';

const WeekPrintView = forwardRef(function WeekPrintView({ weekDates, printHours, getSlotAssignments, weekLabel }, ref) {
  return (
    <article ref={ref} className="week-print-view">
      <header className="week-print-header">
        <div>
          <p className="week-print-badge">Resumen semanal</p>
          <h1>{weekLabel}</h1>
          <p className="week-print-range">
            {formatEuropeanDate(weekDates[0])} – {formatEuropeanDate(weekDates[weekDates.length - 1])}
          </p>
        </div>
        <p className="week-print-description">
          Horario semanal con fechas reales, horas y asignaciones visibles para PDF o papel.
        </p>
      </header>

      <div className="week-print-grid">
        <div className="week-print-cell week-print-hour-header">Hora</div>
        {weekDates.map((day) => (
          <div key={formatDateKey(day)} className="week-print-cell week-print-day-header">
            <strong>{day.toLocaleDateString('es-ES', { weekday: 'long' })}</strong>
            <span>{formatEuropeanDate(day)}</span>
          </div>
        ))}

        {printHours.map((hour) => (
          <div key={`row-${hour}`} className="week-print-row">
            <div className="week-print-cell week-print-hour-cell">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDates.map((day) => {
              const dateKey = formatDateKey(day);
              const slotKey = `${dateKey}-${String(hour).padStart(2, '0')}`;
              const items = getSlotAssignments(slotKey);
              return (
                <div key={slotKey} className="week-print-cell week-print-slot-cell">
                  {items.length > 0 ? (
                    <div className="week-print-slot-list">
                      {items.map((item) => (
                        <div key={item.id} className="week-print-assignment">
                          <span className="week-print-assignment-title">
                            {item.taskId ? item.taskText : item.text}
                          </span>
                          <small>{item.taskId ? 'Tarea real' : 'Manual'}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="week-print-slot-empty">Libre</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <section className="week-print-notes">
        <div>
          <h2>Notas</h2>
          <p>Espacio para apuntes rápidos y recordatorios de la semana.</p>
        </div>
        <div className="week-print-notes-box" />
      </section>
    </article>
  );
});
