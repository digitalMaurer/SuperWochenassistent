import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Inicio' },
  { path: '/tareas', label: 'Tareas' },
  { path: '/semana', label: 'Semana' },
  { path: '/mes', label: 'Mes' },
];

function TopNavigation() {
  return (
    <nav className="app-nav" aria-label="Navegación principal">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `app-nav-link${isActive ? ' active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default TopNavigation;
