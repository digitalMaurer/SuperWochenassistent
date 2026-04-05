import { Route, Routes } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import WeekPage from './pages/WeekPage';
import MonthPage from './pages/MonthPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tareas" element={<TasksPage />} />
        <Route path="semana" element={<WeekPage />} />
        <Route path="mes" element={<MonthPage />} />
      </Route>
    </Routes>
  );
}

export default App;
