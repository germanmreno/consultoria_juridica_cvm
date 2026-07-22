import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Title, Group, TextInput, Badge, Paper, Text } from '@mantine/core';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AlliancesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const puedeCrear = user?.rol === 'ADMIN' || user?.rol === 'OPERADOR';
  const [alliances, setAlliances] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlliances = async () => {
    try {
      const data = await api.alliances.list();
      setAlliances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlliances(); }, []);

  const filtered = alliances.filter(
    (a) =>
      a.denominacionSocial?.toLowerCase().includes(search.toLowerCase()) ||
      a.rif?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Alianzas Registradas</Title>
        {puedeCrear && <Button onClick={() => navigate('/alliances/new')}>Nueva Alianza</Button>}
      </Group>

      <TextInput
        placeholder="Buscar por Denominación Social o RIF..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
      />

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Denominación Social</Table.Th>
              <Table.Th>RIF</Table.Th>
              <Table.Th>Representante</Table.Th>
              <Table.Th>Mineral</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Docs.</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">
                    {loading ? 'Cargando...' : 'No hay alianzas registradas'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {filtered.map((a) => (
              <Table.Tr
                key={a.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/alliances/${a.id}`)}
              >
                <Table.Td fw={500}>{a.denominacionSocial}</Table.Td>
                <Table.Td>{a.rif}</Table.Td>
                <Table.Td>{a.representanteLegal}</Table.Td>
                <Table.Td>
                  <Badge color="#7AB317">{a.mineral}</Badge>
                </Table.Td>
                <Table.Td>{new Date(a.fecha).toLocaleDateString('es-VE')}</Table.Td>
                <Table.Td>{a._count?.files || 0}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
