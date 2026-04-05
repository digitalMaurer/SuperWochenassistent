import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

function MainLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="content-container">
        <div className="page-action-row">
          <div className="page-actions" />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
