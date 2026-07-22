import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Alert } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo electrónico inválido'),
      password: (v) => (v.length < 1 ? 'Contraseña requerida' : null),
    },
  });

  const handleSubmit = async ({ email, password }) => {
    try {
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo-cvm.png" alt="MIDMEIB - CVM" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
          <div>
            <Text size="xs" fw={700} c="#1F3A6E" lh={1.15}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
            <Text size="xs" c="#1F3A6E" lh={1.15}>MINISTERIO DEL PODER POPULAR DE DESARROLLO MINERO Y ECOLÓGICO</Text>
            <Text size="xs" c="#7AB317" fw={600} lh={1.15}>CORPORACIÓN VENEZOLANA DE MINERÍA, S.A. (CVM)</Text>
          </div>
        </div>
        <img src="/logo-bolivia.png" alt="200 Años de la Batalla de Bolivia" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Paper shadow="md" p="xl" withBorder className="w-full max-w-sm mx-4">
          <Title order={3} ta="center" mb="lg">Iniciar Sesión</Title>
          {error && <Alert color="red" mb="md">{error}</Alert>}
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Correo electrónico"
              placeholder="admin@cvm.gob.ve"
              {...form.getInputProps('email')}
              mb="sm"
            />
            <PasswordInput
              label="Contraseña"
              placeholder="••••••••"
              {...form.getInputProps('password')}
              mb="lg"
            />
            <Button type="submit" fullWidth size="md" color="#1F3A6E">
              Ingresar
            </Button>
          </form>
        </Paper>
      </div>
    </div>
  );
}
