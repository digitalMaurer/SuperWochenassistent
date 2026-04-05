function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

function getWeekDates(date) {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    return current;
  });
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatWeekRange(weekDates) {
  const start = weekDates[0];
  const end = weekDates[6];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
  const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `Semana del ${startDay} al ${endDay} de ${startMonth} de ${year}`;
  }

  return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${year}`;
}

function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startOffset);

  const weeks = [];
  let current = new Date(startDate);

  while (weeks.length < 6) {
    const week = Array.from({ length: 7 }, () => {
      const day = new Date(current);
      current.setDate(current.getDate() + 1);
      return day;
    });
    weeks.push(week);
    if (weeks.length > 4 && current.getMonth() > month && current.getDay() === 1) {
      break;
    }
  }

  return weeks;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export { getMonday, getWeekDates, formatDateKey, formatWeekRange, getMonthGrid, formatMonthLabel };
