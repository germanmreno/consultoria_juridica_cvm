import { Group, Box, Text, Divider, Menu, Avatar } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <img
          src={`${import.meta.env.BASE_URL}logo-cvm.png`}
          alt="MIDMEIB - CVM"
          style={{ height: 44, width: 'auto', objectFit: 'contain' }}
        />
        <Box style={{ minWidth: 0 }}>
          <Text size="xs" fw={700} c="#1F3A6E" lh={1.15} truncate>
            REPÚBLICA BOLIVARIANA DE VENEZUELA
          </Text>
          <Text size="xs" c="#1F3A6E" lh={1.15} truncate>
            MINISTERIO DEL PODER POPULAR DE DESARROLLO MINERO Y ECOLÓGICO
          </Text>
          <Text size="xs" c="#7AB317" fw={600} lh={1.15} truncate>
            CORPORACIÓN VENEZOLANA DE MINERÍA, S.A. (CVM)
          </Text>
        </Box>
      </Group>

      <Group gap="md" wrap="nowrap">
        <img
          src={`${import.meta.env.BASE_URL}logo-bolivia.png`}
          alt="200 Años de la Batalla de Bolivia"
          style={{ height: 44, width: 'auto', objectFit: 'contain' }}
        />

        <Divider orientation="vertical" />

        {user && (
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar size="sm" radius="xl" color="#1F3A6E">
                  {user.nombre.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Text size="sm" fw={500} lh={1.1}>{user.nombre}</Text>
                  <Text size="xs" c="dimmed" lh={1.1}>{user.rol}</Text>
                </Box>
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.email}</Menu.Label>
              <Menu.Item onClick={logout} color="red">
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Group>
  );
}
