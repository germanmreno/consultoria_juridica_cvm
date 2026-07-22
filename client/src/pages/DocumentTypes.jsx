import { useState, useEffect } from 'react';
import { Table, Button, Title, Group, Paper, Badge, Switch, Text, Modal, TextInput, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DocumentTypesPage() {
  const { user } = useAuth();
  const puedeEditar = user?.rol === 'ADMIN' || user?.rol === 'OPERADOR';
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ code: '', nombre: '', descripcion: '', orden: 99, valor: 0 });

  const fetchTypes = async () => {
    try {
      setTypes(await api.documentTypes.list());
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const resetForm = () => setForm({ code: '', nombre: '', descripcion: '', orden: 99, valor: 0 });

  const handleCreate = async () => {
    try {
      await api.documentTypes.create({ ...form, valor: form.valor || 0 });
      setCreateModal(false);
      resetForm();
      notifications.show({ title: 'Éxito', message: 'Tipo de documento creado', color: 'green' });
      fetchTypes();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleUpdate = async () => {
    try {
      await api.documentTypes.update(editModal, { ...form, valor: form.valor || 0 });
      setEditModal(null);
      resetForm();
      notifications.show({ title: 'Éxito', message: 'Tipo de documento actualizado', color: 'green' });
      fetchTypes();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleToggle = async (type) => {
    try {
      await api.documentTypes.update(type.id, { activo: !type.activo });
      notifications.show({ title: 'Éxito', message: `Tipo ${type.activo ? 'desactivado' : 'activado'}`, color: 'green' });
      fetchTypes();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const openEdit = (type) => {
    setForm({ code: type.code, nombre: type.nombre, descripcion: type.descripcion || '', orden: type.orden, valor: type.valor || 0 });
    setEditModal(type.id);
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Tipos de Documento</Title>
        {puedeEditar && <Button onClick={() => { resetForm(); setCreateModal(true); }}>Nuevo Tipo</Button>}
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Código</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Obligatorio</Table.Th>
              <Table.Th>Valor %</Table.Th>
              {puedeEditar && <Table.Th>Activo</Table.Th>}
              <Table.Th>Orden</Table.Th>
              {puedeEditar && <Table.Th></Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {types.map((t, i) => (
              <Table.Tr key={t.id}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td><Badge variant="light">{t.code}</Badge></Table.Td>
                <Table.Td>
                  <Text size="sm">{t.nombre}</Text>
                  {t.descripcion && <Text size="xs" c="dimmed">{t.descripcion}</Text>}
                </Table.Td>
                    <Table.Td>{t.obligatorio ? 'Sí' : 'No'}</Table.Td>
                    <Table.Td fw={600}>{t.valor}%</Table.Td>
                    {puedeEditar && (
                      <Table.Td>
                        <Switch checked={t.activo} onChange={() => handleToggle(t)} />
                      </Table.Td>
                    )}
                    <Table.Td>{t.orden}</Table.Td>
                    {puedeEditar && (
                      <Table.Td>
                        <Button size="xs" variant="light" onClick={() => openEdit(t)}>Editar</Button>
                      </Table.Td>
                    )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Nuevo Tipo de Documento" size="sm">
        <TextInput label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.currentTarget.value })} mb="sm" />
        <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })} mb="sm" />
        <TextInput label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.currentTarget.value })} mb="sm" />
        <NumberInput label="Valor % (ponderación compartida)" value={form.valor} onChange={(v) => setForm({ ...form, valor: v || 0 })} min={0} max={100} decimalScale={1} mb="sm" />
        <NumberInput label="Orden" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} mb="lg" />
        <Button fullWidth onClick={handleCreate} disabled={!form.code || !form.nombre}>Crear</Button>
      </Modal>

      <Modal opened={!!editModal} onClose={() => setEditModal(null)} title="Editar Tipo de Documento" size="sm">
        <TextInput label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.currentTarget.value })} mb="sm" />
        <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })} mb="sm" />
        <TextInput label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.currentTarget.value })} mb="sm" />
        <NumberInput label="Valor % (ponderación compartida)" value={form.valor} onChange={(v) => setForm({ ...form, valor: v || 0 })} min={0} max={100} decimalScale={1} mb="sm" />
        <NumberInput label="Orden" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} mb="lg" />
        <Button fullWidth onClick={handleUpdate} disabled={!form.code || !form.nombre}>Guardar</Button>
      </Modal>
    </div>
  );
}
