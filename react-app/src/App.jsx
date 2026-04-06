import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import WeekPage from './pages/WeekPage';
import MonthPage from './pages/MonthPage';

const WeekPrintPage = lazy(() => import('./pages/WeekPrintPage'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tareas" element={<TasksPage />} />
        <Route path="semana" element={<WeekPage />} />
        <Route path="semana/print" element={
          <Suspense fallback={<div>Cargando impresión...</div>}>
            <WeekPrintPage />
          </Suspense>
        } />
        <Route path="mes" element={<MonthPage />} />
      </Route>
    </Routes>
  );
}

export default App;
