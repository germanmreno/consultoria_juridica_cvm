import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { Button, Paper, Title, TextInput, Select, Group, Alert, Loader } from '@mantine/core';
import { api } from '../api/client';

export default function AllianceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues: {
      denominacionSocial: '',
      rif: '',
      representanteLegal: '',
      cedulaRepresentante: '',
      telefono: '',
      email: '',
      sector: '',
      area: '',
      mineral: 'ORO',
      fecha: '',
    },
    validate: {
      denominacionSocial: (v) => (v ? null : 'Requerido'),
      rif: (v) => (v ? null : 'Requerido'),
      representanteLegal: (v) => (v ? null : 'Requerido'),
      cedulaRepresentante: (v) => (v ? null : 'Requerido'),
      telefono: (v) => (v ? null : 'Requerido'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      sector: (v) => (v ? null : 'Requerido'),
      area: (v) => (v ? null : 'Requerido'),
      fecha: (v) => (v ? null : 'Requerido'),
    },
  });

  useEffect(() => {
    if (isEdit) {
      api.alliances
        .get(id)
        .then((data) => {
          form.setValues({
            ...data,
            fecha: data.fecha ? data.fecha.slice(0, 10) : '',
          });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values) => {
    try {
      setError(null);
      if (isEdit) {
        await api.alliances.update(id, values);
      } else {
        await api.alliances.create(values);
      }
      navigate(isEdit ? `/alliances/${id}` : '/alliances');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader size="lg" className="mx-auto mt-12 block" />;

  return (
    <div className="max-w-2xl mx-auto">
      <Title order={2} mb="lg">{isEdit ? 'Editar Alianza' : 'Nueva Alianza'}</Title>

      {error && <Alert color="red" mb="md">{error}</Alert>}

      <Paper withBorder p="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Group grow mb="sm">
            <TextInput label="Denominación Social" {...form.getInputProps('denominacionSocial')} />
            <TextInput label="RIF" {...form.getInputProps('rif')} />
          </Group>
          <Group grow mb="sm">
            <TextInput label="Representante Legal" {...form.getInputProps('representanteLegal')} />
            <TextInput label="Cédula del Representante" {...form.getInputProps('cedulaRepresentante')} />
          </Group>
          <Group grow mb="sm">
            <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
            <TextInput label="Correo Electrónico" {...form.getInputProps('email')} />
          </Group>
          <Group grow mb="sm">
            <TextInput label="Sector" {...form.getInputProps('sector')} />
            <TextInput label="Área" {...form.getInputProps('area')} />
          </Group>
          <Group grow mb="lg">
            <Select
              label="Mineral"
              data={['ORO']}
              {...form.getInputProps('mineral')}
            />
            <TextInput
              label="Fecha"
              type="date"
              {...form.getInputProps('fecha')}
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Crear Alianza'}</Button>
          </Group>
        </form>
      </Paper>
    </div>
  );
}
