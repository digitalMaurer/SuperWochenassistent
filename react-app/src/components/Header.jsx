import TopNavigation from './TopNavigation';

function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">P</span>
        <div>
          <h1>Productividad</h1>
          <p>Administración simple de tareas y semanas.</p>
        </div>
      </div>
      <TopNavigation />
    </header>
  );
}

export default Header;
