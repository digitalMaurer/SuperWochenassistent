import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDateKey, formatEuropeanDate } from '../utils/dateHelpers';
import WeekPrintPosterDocument from './WeekPrintPosterDocument';
import { WeekPrintA2Canvas } from './WeekPrintA2Canvas';
import WeekPrintA2Content from './WeekPrintA2Content';

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    marginBottom: 2,
  },
  range: {
    fontSize: 9,
    color: '#4b5563',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 6,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 4,
    fontSize: 8,
  },
  timeCell: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dayHeaderWeekday: {
    fontSize: 8,
  },
  dayHeaderDate: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 2,
  },
  slotCell: {
    flex: 1,
    minHeight: 27,
  },
  slotEmpty: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  assignmentTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assignmentType: {
    fontSize: 7,
    color: '#6b7280',
  },
  pageFooter: {
    marginTop: 12,
  },
  footerText: {
    fontSize: 7,
    color: '#6b7280',
  },
  subHeader: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 6,
  },
});

function chunkArray(array, parts) {
  const size = Math.ceil(array.length / parts);
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function renderTable({ weekDates, printHours, getSlotAssignments }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, styles.timeCell]}>
          <Text>Hora</Text>
        </View>
        {weekDates.map((day) => (
          <View key={formatDateKey(day)} style={[styles.tableCell, styles.dayHeader]}>
            <Text style={styles.dayHeaderWeekday}>
              {day.toLocaleDateString('es-ES', { weekday: 'short' })}
            </Text>
            <Text style={styles.dayHeaderDate}>{formatEuropeanDate(day)}</Text>
          </View>
        ))}
      </View>

      {printHours.map((hour) => (
        <View key={`row-${hour}`} style={styles.tableRow}>
          <View style={[styles.tableCell, styles.timeCell]}>
            <Text>{String(hour).padStart(2, '0')}:00</Text>
          </View>
          {weekDates.map((day) => {
            const dateKey = formatDateKey(day);
            const slotKey = `${dateKey}-${String(hour).padStart(2, '0')}`;
            const items = getSlotAssignments(slotKey);
            return (
              <View key={slotKey} style={[styles.tableCell, styles.slotCell]}>
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


function WeekPrintDocument({ weekDates, printHours, getSlotAssignments, weekLabel, printMode, outputMode = 'single' }) {
  // Modo poster: delega en WeekPrintPosterDocument
  if (printMode === 'A2' && outputMode === 'split') {
    return (
      <WeekPrintPosterDocument
        weekDates={weekDates}
        printHours={printHours}
        getSlotAssignments={getSlotAssignments}
        weekLabel={weekLabel}
      />
    );
  }

  // Modo A2: layout maestro
  if (printMode === 'A2') {
    return (
      <Document>
        <Page size={{ width: 1684, height: 1190 }} orientation="landscape" style={{ padding: 0, margin: 0 }}>
          <WeekPrintA2Canvas>
            <WeekPrintA2Content
              weekDates={weekDates}
              printHours={printHours}
              getSlotAssignments={getSlotAssignments}
              weekLabel={weekLabel}
            />
          </WeekPrintA2Canvas>
        </Page>
      </Document>
    );
  }

  // Modo A4 clásico
  const weekStart = formatEuropeanDate(weekDates[0]);
  const weekEnd = formatEuropeanDate(weekDates[weekDates.length - 1]);
  const renderPageHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Semana de impresión</Text>
      <Text style={styles.label}>{weekLabel}</Text>
      <Text style={styles.range}>{weekStart} – {weekEnd}</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderPageHeader()}
        {renderTable({ weekDates, printHours, getSlotAssignments })}
      </Page>
    </Document>
  );
}

export default WeekPrintDocument;
