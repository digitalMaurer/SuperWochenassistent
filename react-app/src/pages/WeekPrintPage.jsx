import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BlobProvider, PDFViewer } from '@react-pdf/renderer/lib/react-pdf.browser.js';
import { loadSchedule } from '../utils/weekScheduleStorage';
import { getWeekDates, formatEuropeanDate, formatWeekRange } from '../utils/dateHelpers';
import WeekPrintDocument from '../components/WeekPrintDocument';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function WeekPrintPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState({ version: 1, slots: {} });
  const [printStartHour, setPrintStartHour] = useState(7);
  const [printEndHour, setPrintEndHour] = useState(22);
  const [printMode, setPrintMode] = useState('A4');
  const location = useLocation();

  useEffect(() => {
    setSchedule(loadSchedule());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const from = Number(params.get('from'));
    const to = Number(params.get('to'));

    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }

    if (!Number.isNaN(from) && from >= HOURS[0] && from <= HOURS[HOURS.length - 1]) {
      setPrintStartHour(from);
    }

    if (!Number.isNaN(to) && to >= HOURS[0] && to <= HOURS[HOURS.length - 1]) {
      setPrintEndHour(to);
    }
  }, [location.search]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekLabel = useMemo(() => formatWeekRange(weekDates), [weekDates]);
  const printHours = useMemo(
    () => HOURS.filter((hour) => hour >= printStartHour && hour <= printEndHour),
    [printStartHour, printEndHour]
  );

  const getSlotAssignments = (key) => schedule.slots[key] || [];


  const document = (
    <WeekPrintDocument
      weekDates={weekDates}
      printHours={printHours}
      getSlotAssignments={getSlotAssignments}
      weekLabel={weekLabel}
      printMode={printMode}
      outputMode="single"
    />
  );

  const posterDocument = printMode === 'A2' ? (
    <WeekPrintDocument
      weekDates={weekDates}
      printHours={printHours}
      getSlotAssignments={getSlotAssignments}
      weekLabel={weekLabel}
      printMode={printMode}
      outputMode="split"
    />
  ) : null;

  const handlePrintStartHourChange = (value) => {
    const next = Number(value);
    setPrintStartHour(next);
    if (next > printEndHour) {
      setPrintEndHour(next);
    }
  };

  const handlePrintEndHourChange = (value) => {
    const next = Number(value);
    setPrintEndHour(next);
    if (next < printStartHour) {
      setPrintStartHour(next);
    }
  };

  return (
    <section className="page-panel week-print-page">
      <div className="week-print-toolbar">
        <div>
          <h2>Control de impresión</h2>
          <p>{weekLabel}</p>
          <p className="week-print-range">
            {formatEuropeanDate(weekDates[0])} – {formatEuropeanDate(weekDates[weekDates.length - 1])}
          </p>
        </div>
        <div className="week-print-actions">
          <BlobProvider document={document}>
            {({ url, loading }) => (
              <button
                type="button"
                className="print-button"
                onClick={() => url && window.open(url, '_blank')}
                disabled={loading || !url}
              >
                {loading
                  ? 'Generando PDF...'
                  : printMode === 'A2'
                  ? 'Abrir A2 completo'
                  : 'Abrir A4 para imprimir'}
              </button>
            )}
          </BlobProvider>
          {posterDocument && (
            <button
              type="button"
              className="print-button"
              disabled
              title="Función poster 4xA4 en desarrollo. Pronto disponible."
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              Poster 4xA4 (en desarrollo)
            </button>
          )}
        </div>
      </div>

      <div className="week-print-settings">
        <div className="week-print-setting-card">
          <h3>Configuración de impresión</h3>

          <div className="week-print-setting-row">
            <label>
              Mostrar horas de
              <select value={printStartHour} onChange={(e) => handlePrintStartHourChange(e.target.value)}>
                {HOURS.filter((hour) => hour <= printEndHour).map((hour) => (
                  <option key={`from-${hour}`} value={hour}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>

            <label>
              a
              <select value={printEndHour} onChange={(e) => handlePrintEndHourChange(e.target.value)}>
                {HOURS.filter((hour) => hour >= printStartHour).map((hour) => (
                  <option key={`to-${hour}`} value={hour}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="week-print-setting-row">
            <label>
              Formato
              <select value={printMode} onChange={(e) => setPrintMode(e.target.value)}>
                <option value="A4">A4 - Página única</option>
                <option value="A2">A2 - página grande + 4 A4</option>
              </select>
            </label>
          </div>

          <p className="week-print-help">
            En A2 puedes abrir el documento A2 completo. La opción "Poster 4xA4" está deshabilitada temporalmente por problemas de corte y alineación.
          </p>
        </div>
      </div>

      <div className="week-print-preview">
        <PDFViewer style={{ width: '100%', height: '80vh' }}>{document}</PDFViewer>
      </div>
    </section>
  );
}

export default WeekPrintPage;
