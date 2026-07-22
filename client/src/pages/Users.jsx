import { useState, useEffect } from 'react';
import { Table, Button, Title, Group, Paper, Badge, Switch, Text, Modal, TextInput, PasswordInput, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'OPERADOR' });

  const fetchUsers = async () => {
    try {
      setUsers(await api.users.list());
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => setForm({ nombre: '', email: '', password: '', rol: 'OPERADOR' });

  const handleCreate = async () => {
    try {
      await api.users.create(form);
      setCreateModal(false);
      resetForm();
      notifications.show({ title: 'Éxito', message: 'Usuario creado', color: 'green' });
      fetchUsers();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleUpdate = async () => {
    try {
      const data = { nombre: form.nombre, email: form.email, rol: form.rol };
      if (form.password) data.password = form.password;
      await api.users.update(editModal, data);
      setEditModal(null);
      resetForm();
      notifications.show({ title: 'Éxito', message: 'Usuario actualizado', color: 'green' });
      fetchUsers();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleToggle = async (user) => {
    try {
      await api.users.update(user.id, { activo: !user.activo });
      notifications.show({ title: 'Éxito', message: `Usuario ${user.activo ? 'desactivado' : 'activado'}`, color: 'green' });
      fetchUsers();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const openEdit = (user) => {
    setForm({ nombre: user.nombre, email: user.email, password: '', rol: user.rol });
    setEditModal(user.id);
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Usuarios</Title>
        <Button onClick={() => { resetForm(); setCreateModal(true); }}>Nuevo Usuario</Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td fw={500}>{u.nombre}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>
                  <Badge color={u.rol === 'ADMIN' ? 'red' : u.rol === 'VISUALIZADOR' ? 'yellow' : 'blue'}>{u.rol}</Badge>
                </Table.Td>
                <Table.Td>
                  <Switch checked={u.activo} onChange={() => handleToggle(u)} />
                </Table.Td>
                <Table.Td>
                  <Button size="xs" variant="light" onClick={() => openEdit(u)}>Editar</Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Nuevo Usuario" size="sm">
        <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })} mb="sm" />
        <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.currentTarget.value })} mb="sm" />
        <PasswordInput label="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.currentTarget.value })} mb="sm" />
<Select label="Rol" data={['ADMIN', 'OPERADOR', 'VISUALIZADOR']} value={form.rol} onChange={(v) => setForm({ ...form, rol: v })} mb="lg" />
          <Button fullWidth onClick={handleCreate} disabled={!form.nombre || !form.email || !form.password}>Crear</Button>
        </Modal>

        <Modal opened={!!editModal} onClose={() => setEditModal(null)} title="Editar Usuario" size="sm">
          <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })} mb="sm" />
          <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.currentTarget.value })} mb="sm" />
          <PasswordInput label="Contraseña (dejar vacía para no cambiar)" value={form.password} onChange={(e) => setForm({ ...form, password: e.currentTarget.value })} mb="sm" />
          <Select label="Rol" data={['ADMIN', 'OPERADOR', 'VISUALIZADOR']} value={form.rol} onChange={(v) => setForm({ ...form, rol: v })} mb="lg" />
        <Button fullWidth onClick={handleUpdate} disabled={!form.nombre || !form.email}>Guardar</Button>
      </Modal>
    </div>
  );
}
