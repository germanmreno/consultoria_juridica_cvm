import { AppShell, NavLink } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Alianzas', path: '/alliances' },
    { label: 'Tipos de Documento', path: '/document-types' },
    ...(user?.rol === 'ADMIN' ? [{ label: 'Usuarios', path: '/users' }] : []),
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
            variant="filled"
            mb="xs"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
