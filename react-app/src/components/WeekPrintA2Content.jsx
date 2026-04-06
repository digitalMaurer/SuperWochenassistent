
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatDateKey, formatEuropeanDate } from '../utils/dateHelpers';

const HEADER_HEIGHT = 110;
const BORDER = 2;

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    position: 'relative',
    padding: 0,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: HEADER_HEIGHT,
    backgroundColor: '#fff',
    borderBottom: `${BORDER}pt solid #bbb`,
    padding: 32,
    zIndex: 2,
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 20,
    marginBottom: 2,
  },
  range: {
    fontSize: 15,
    color: '#4b5563',
  },
  cell: {
    border: `${BORDER}pt solid #bbb`,
    boxSizing: 'border-box',
    padding: 8,
    fontSize: 13,
    minHeight: 0,
    backgroundColor: '#fff',
  },
  timeCell: {
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f3f4f6',
  },
  dayHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f3f4f6',
    fontSize: 13,
    paddingBottom: 2,
  },
  slotEmpty: {
    color: '#6b7280',
    fontStyle: 'italic',
    fontSize: 12,
  },
  assignmentTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assignmentType: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default function WeekPrintA2Content({ weekDates, printHours, getSlotAssignments, weekLabel }) {
  // Dimensiones absolutas
  const A2_WIDTH = 1684;
  const A2_HEIGHT = 1190;
  const nDays = weekDates.length;
  const nHours = printHours.length;
  const HOUR_COL_WIDTH = 90; // ancho fijo para columna de horas
  const GRID_LEFT = 0;
  const GRID_TOP = HEADER_HEIGHT;
  const GRID_WIDTH = A2_WIDTH;
  const GRID_HEIGHT = A2_HEIGHT - HEADER_HEIGHT;
  // Cálculo exacto de anchos para evitar acumulación de error
  // Se calcula el ancho base y el sobrante se reparte en las primeras columnas
  const baseDayColWidth = Math.floor((GRID_WIDTH - HOUR_COL_WIDTH) / nDays);
  const remainder = (GRID_WIDTH - HOUR_COL_WIDTH) - baseDayColWidth * nDays;
  const dayColWidths = Array.from({ length: nDays }, (_, i) => baseDayColWidth + (i < remainder ? 1 : 0));
  const ROW_HEIGHT = GRID_HEIGHT / (nHours + 1); // +1 para cabecera días

  return (
    <View style={styles.root}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.title}>Semana de impresión</Text>
        <Text style={styles.label}>{weekLabel}</Text>
        <Text style={styles.range}>
          {formatEuropeanDate(weekDates[0])} – {formatEuropeanDate(weekDates[weekDates.length - 1])}
        </Text>
      </View>
      {/* Grid semanal absoluta */}
      {/* Fila de cabecera */}
      <View
        style={{
          position: 'absolute',
          left: GRID_LEFT,
          top: GRID_TOP,
          flexDirection: 'row',
        }}
      >
        <View style={[styles.cell, styles.timeCell, { width: HOUR_COL_WIDTH, height: ROW_HEIGHT }]}>Hora</View>
        {weekDates.map((day, i) => (
          <View
            key={formatDateKey(day)}
            style={[styles.cell, styles.dayHeader, { width: dayColWidths[i], height: ROW_HEIGHT }]}
          >
            <Text>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>{formatEuropeanDate(day)}</Text>
          </View>
        ))}
      </View>
      {/* Filas de horas */}
      {printHours.map((hour, rowIdx) => (
        <View
          key={`row-${hour}`}
          style={{
            position: 'absolute',
            left: GRID_LEFT,
            top: GRID_TOP + (rowIdx + 1) * ROW_HEIGHT,
            flexDirection: 'row',
          }}
        >
          <View style={[styles.cell, styles.timeCell, { width: HOUR_COL_WIDTH, height: ROW_HEIGHT }]}>
            {String(hour).padStart(2, '0')}:00
          </View>
          {weekDates.map((day, colIdx) => {
            const dateKey = formatDateKey(day);
            const slotKey = `${dateKey}-${String(hour).padStart(2, '0')}`;
            const items = getSlotAssignments(slotKey);
            return (
              <View
                key={slotKey}
                style={[styles.cell, { width: dayColWidths[colIdx], height: ROW_HEIGHT }]}
              >
                {items.length > 0 ? (
                  items.map((item) => (
                    <View key={item.id}>
                      <Text style={styles.assignmentTitle}>{item.taskId ? item.taskText : item.text}</Text>
                      <Text style={styles.assignmentType}>{item.taskId ? 'Tarea real' : 'Manual'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.slotEmpty}>Libre</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
