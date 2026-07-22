import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs, Title, Text, Button, Group, Paper, Table, Badge, Loader, Alert,
  TextInput, NumberInput, Select, FileInput, ActionIcon, Modal, Anchor, Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AllianceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const puedeEditar = user?.rol === 'ADMIN' || user?.rol === 'OPERADOR';
  const [alliance, setAlliance] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [documentTypes, setDocumentTypes] = useState([]);
  const [newFile, setNewFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [indexModal, setIndexModal] = useState(null);
  const [idxDocType, setIdxDocType] = useState('');
  const [idxFrom, setIdxFrom] = useState(1);
  const [idxTo, setIdxTo] = useState(1);
  const [idxNotas, setIdxNotas] = useState('');

  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFrom, setUploadFrom] = useState(1);
  const [uploadTo, setUploadTo] = useState(1);

  const [evalItems, setEvalItems] = useState([]);
  const [evalSaving, setEvalSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(puedeEditar ? 'docs' : 'reqs');

  const fetchData = async () => {
    try {
      const [allianceData, reqsData, typesData, evalData] = await Promise.all([
        api.alliances.get(id),
        api.alliances.requirements(id),
        api.documentTypes.activos(),
        api.evaluations.get(id),
      ]);
      setAlliance(allianceData);
      setRequirements(reqsData);
      setDocumentTypes(typesData);
      if (evalData?.items) setEvalItems(evalData.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (activeTab === 'ficha') {
      api.evaluations.get(id).then((d) => { if (d?.items) setEvalItems(d.items); }).catch(() => {});
    }
  }, [activeTab, id]);

  const handleUpload = async () => {
    if (!newFile) return;
    setUploading(true);
    try {
      const indexData = uploadDocType
        ? { documentTypeId: uploadDocType, pageFrom: uploadFrom, pageTo: uploadTo }
        : null;
      const result = await api.files.upload(id, newFile, indexData);
      setNewFile(null);
      setUploadDocType('');
      setUploadFrom(1);
      setUploadTo(1);
      const msg = result?.index ? 'Archivo subido e indexado correctamente' : 'Archivo subido correctamente';
      notifications.show({ title: 'Éxito', message: msg, color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddIndex = async () => {
    if (!idxDocType || !idxFrom || !idxTo) return;
    try {
      await api.indexes.create(indexModal, {
        documentTypeId: idxDocType,
        pageFrom: idxFrom,
        pageTo: idxTo,
        notas: idxNotas,
      });
      setIndexModal(null);
      setIdxDocType('');
      setIdxFrom(1);
      setIdxTo(1);
      setIdxNotas('');
      notifications.show({ title: 'Éxito', message: 'Índice creado', color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleDeleteIndex = async (indexId) => {
    try {
      await api.indexes.delete(indexId);
      notifications.show({ title: 'Éxito', message: 'Índice eliminado', color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    }
  };

  const handleEvalUpdate = (documentTypeId, field, value) => {
    setEvalItems((prev) => prev.map((it) => (it.documentTypeId === documentTypeId ? { ...it, [field]: value } : it)));
  };

  const handleSaveEvaluation = async () => {
    setEvalSaving(true);
    try {
      const payload = evalItems.map((it) => ({
        documentTypeId: it.documentTypeId,
        estadoOverride: it.estado === 'SI' || it.estado === 'NO' || it.estado === 'N/A' ? it.estado : null,
        ponderacion: it.estado === 'SI' ? (it.ponderacion ?? it.valor) : null,
        observaciones: it.observaciones,
      }));
      await api.evaluations.save(id, payload);
      notifications.show({ title: 'Éxito', message: 'Ficha técnica guardada', color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setEvalSaving(false);
    }
  };

  if (loading) return <Loader size="lg" className="mx-auto mt-12 block" />;
  if (error) return <Alert color="red">{error}</Alert>;
  if (!alliance) return <Alert color="yellow">Alianza no encontrada</Alert>;

  const indexedCount = requirements.filter((r) => r.status === 'cargado').length;
  const totalPonderacion = evalItems.reduce((s, i) => s + (i.ponderacion || 0), 0);
  const totalValor = evalItems.reduce((s, i) => s + (i.valor || 0), 0);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{alliance.denominacionSocial}</Title>
          <Text c="dimmed" size="sm">RIF: {alliance.rif}</Text>
        </div>
        <Group>
          {puedeEditar && (
            <Button variant="outline" onClick={() => navigate(`/alliances/${id}/edit`)}>
              Editar
            </Button>
          )}
          <Button variant="default" onClick={() => navigate('/alliances')}>
            Volver
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md" mb="lg">
        <Group gap="xl">
          <div><Text size="xs" c="dimmed">Representante Legal</Text><Text fw={500}>{alliance.representanteLegal}</Text></div>
          <div><Text size="xs" c="dimmed">Cédula</Text><Text fw={500}>{alliance.cedulaRepresentante}</Text></div>
          <div><Text size="xs" c="dimmed">Teléfono</Text><Text fw={500}>{alliance.telefono}</Text></div>
          <div><Text size="xs" c="dimmed">Email</Text><Text fw={500}>{alliance.email}</Text></div>
          <div><Text size="xs" c="dimmed">Sector / Área</Text><Text fw={500}>{alliance.sector} / {alliance.area}</Text></div>
          <div><Text size="xs" c="dimmed">Mineral</Text><Badge color="#7AB317">{alliance.mineral}</Badge></div>
          <div><Text size="xs" c="dimmed">Fecha</Text><Text fw={500}>{new Date(alliance.fecha).toLocaleDateString('es-VE')}</Text></div>
        </Group>
      </Paper>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          {puedeEditar && (
            <Tabs.Tab value="docs">Documentos ({alliance.files?.length || 0})</Tabs.Tab>
          )}
          <Tabs.Tab value="reqs">
            Requisitos ({indexedCount}/{requirements.length})
          </Tabs.Tab>
          <Tabs.Tab value="ficha">
            Ficha Técnica ({totalPonderacion.toFixed(0)}%)
          </Tabs.Tab>
        </Tabs.List>

        {puedeEditar && (
        <Tabs.Panel value="docs">
            <Paper withBorder p="md" mb="md">
              <Group mb="sm">
                <FileInput
                  accept="application/pdf"
                  placeholder="Seleccionar PDF..."
                  value={newFile}
                  onChange={setNewFile}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleUpload} loading={uploading} disabled={!newFile}>
                  {newFile ? (uploadDocType ? 'Subir e Indexar' : 'Subir') : 'Subir'}
                </Button>
              </Group>
              {newFile && (
                <Group grow>
                  <Select
                    label="Tipo de documento (opcional)"
                    placeholder="Solo subir archivo"
                    data={documentTypes.map((dt) => ({ value: dt.id, label: `${dt.code} — ${dt.nombre}` }))}
                    value={uploadDocType}
                    onChange={setUploadDocType}
                    searchable
                    clearable
                  />
                  <NumberInput
                    label="Página desde"
                    min={1}
                    value={uploadFrom}
                    onChange={(v) => { setUploadFrom(v); setUploadTo(Math.max(v, uploadTo)); }}
                    disabled={!uploadDocType}
                  />
                  <NumberInput
                    label="Página hasta"
                    min={uploadFrom}
                    value={uploadTo}
                    onChange={setUploadTo}
                    disabled={!uploadDocType}
                  />
                </Group>
              )}
            </Paper>

          {alliance.files?.map((file) => (
            <Paper withBorder p="md" mb="md" key={file.id}>
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={500}>{file.originalName}</Text>
                  <Text size="xs" c="dimmed">
                    {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB — {file.pageCount} páginas
                    {file.uploadedBy && ` — por ${file.uploadedBy.nombre}`}
                  </Text>
                </div>
                <Group>
                  <Anchor href={api.files.contentUrl(file.id)} target="_blank" size="sm">
                    Ver PDF
                  </Anchor>
                  {puedeEditar && (
                    <Button size="xs" variant="light" onClick={() => setIndexModal(file.id)}>
                      Indexar
                    </Button>
                  )}
                </Group>
              </Group>

              {file.indexes?.length > 0 && (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tipo Documento</Table.Th>
                      <Table.Th>Páginas</Table.Th>
                      <Table.Th>Notas</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {file.indexes.map((idx) => (
                      <Table.Tr key={idx.id}>
                        <Table.Td>{idx.documentType?.nombre || idx.documentTypeId}</Table.Td>
                        <Table.Td>{idx.pageFrom} – {idx.pageTo}</Table.Td>
                        <Table.Td>{idx.notas || '—'}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Anchor href={api.indexes.viewUrl(idx.id)} target="_blank" size="xs">
                              Ver
                            </Anchor>
                            <Anchor href={api.indexes.exportUrl(idx.id)} size="xs">
                              Descargar
                            </Anchor>
                            <ActionIcon color="red" size="sm" onClick={() => handleDeleteIndex(idx.id)}>
                              ✕
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          ))}

          {(!alliance.files || alliance.files.length === 0) && (
            <Text c="dimmed" ta="center" py="xl">No hay documentos subidos para esta alianza.</Text>
          )}

          <Modal
            opened={!!indexModal}
            onClose={() => setIndexModal(null)}
            title="Nuevo Índice"
            size="sm"
          >
            <Select
              label="Tipo de Documento"
              data={documentTypes.map((dt) => ({ value: dt.id, label: `${dt.code} — ${dt.nombre}` }))}
              value={idxDocType}
              onChange={setIdxDocType}
              searchable
              mb="sm"
            />
            <Group grow mb="sm">
              <NumberInput label="Página desde" min={1} value={idxFrom} onChange={(v) => { setIdxFrom(v); setIdxTo(Math.max(v, idxTo)); }} />
              <NumberInput label="Página hasta" min={idxFrom} value={idxTo} onChange={setIdxTo} />
            </Group>
            <TextInput label="Notas" value={idxNotas} onChange={(e) => setIdxNotas(e.currentTarget.value)} mb="lg" />
            <Button fullWidth onClick={handleAddIndex} disabled={!idxDocType}>Agregar Índice</Button>
          </Modal>
        </Tabs.Panel>
        )}

        <Tabs.Panel value="reqs">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Requisito</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Documento</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requirements.map((r, i) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="gray">{r.code}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{r.nombre}</Text>
                      {r.descripcion && (
                        <Text size="xs" c="dimmed">{r.descripcion}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={r.status === 'cargado' ? 'green' : 'yellow'}>
                        {r.status === 'cargado' ? 'Cargado' : 'Pendiente'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {r.referencias?.length > 0 ? (
                        <Group gap="xs">
                          <Anchor href={api.indexes.viewUrl(r.referencias[0].indexId)} target="_blank" size="xs">
                            Ver
                          </Anchor>
                          <Anchor href={api.indexes.exportUrl(r.referencias[0].indexId)} size="xs">
                            Descargar
                          </Anchor>
                          {r.referencias.length > 1 && (
                            <Menu shadow="md" width={280}>
                              <Menu.Target>
                                <Text size="xs" c="cvm-blue" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }} fw={500}>
                                  +{r.referencias.length - 1} más
                                </Text>
                              </Menu.Target>
                              <Menu.Dropdown>
                                {r.referencias.slice(1).map((ref, ri) => (
                                  <Menu.Item key={ri}>
                                    <Group gap="xs" wrap="nowrap">
                                      <Text size="xs" style={{ flex: 1 }} truncate>
                                        {ref.fileName}
                                      </Text>
                                      <Text size="xs" c="dimmed">pág {ref.pageFrom}–{ref.pageTo}</Text>
                                      <Anchor href={api.indexes.viewUrl(ref.indexId)} target="_blank" size="xs">
                                        Ver
                                      </Anchor>
                                      <Anchor href={api.indexes.exportUrl(ref.indexId)} size="xs">
                                        Desc
                                      </Anchor>
                                    </Group>
                                  </Menu.Item>
                                ))}
                              </Menu.Dropdown>
                            </Menu>
                          )}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="ficha">
          <Group justify="space-between" mb="md">
            <Text size="sm" c="dimmed">
              Peso total asignado: {totalValor.toFixed(0)}% {totalValor !== 100 ? <Text component="span" c="yellow" size="sm">(ideal: 100%)</Text> : null}
            </Text>
            <Group>
              <Button
                variant="light"
                component="a"
                href={api.evaluations.pdfUrl(id)}
                target="_blank"
              >
                Exportar PDF
              </Button>
              {puedeEditar && (
                <Button onClick={handleSaveEvaluation} loading={evalSaving}>Guardar Ficha</Button>
              )}
            </Group>
          </Group>
          <Paper withBorder style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={30}>N°</Table.Th>
                  <Table.Th>REQUISITOS EXIGIDOS</Table.Th>
                  <Table.Th w={50} ta="center">SÍ</Table.Th>
                  <Table.Th w={50} ta="center">NO</Table.Th>
                  <Table.Th w={50} ta="center">N/A</Table.Th>
                  <Table.Th w={80}>VALOR %</Table.Th>
                  <Table.Th w={90}>PONDERACIÓN</Table.Th>
                  <Table.Th>OBSERVACIONES</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {evalItems.map((item, i) => (
                  <Table.Tr key={item.documentTypeId}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{item.nombre}</Text>
                      <Text size="xs" c="dimmed">{item.code}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text
                        size="xs"
                        fw={item.estado === 'SI' ? 700 : 400}
                        c={item.estado === 'SI' ? 'green' : 'gray'}
                        style={{ cursor: puedeEditar ? 'pointer' : 'default' }}
                        onClick={() => puedeEditar && handleEvalUpdate(item.documentTypeId, 'estado', item.estado === 'SI' ? 'NO' : 'SI')}
                      >
                        {item.estado === 'SI' ? '✔' : '○'}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text
                        size="xs"
                        fw={item.estado === 'NO' ? 700 : 400}
                        c={item.estado === 'NO' ? 'red' : 'gray'}
                        style={{ cursor: puedeEditar ? 'pointer' : 'default' }}
                        onClick={() => puedeEditar && handleEvalUpdate(item.documentTypeId, 'estado', item.estado === 'NO' ? 'SI' : 'NO')}
                      >
                        {item.estado === 'NO' ? '✘' : '○'}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text
                        size="xs"
                        fw={item.estado === 'N/A' ? 700 : 400}
                        c={item.estado === 'N/A' ? 'yellow' : 'gray'}
                        style={{ cursor: puedeEditar ? 'pointer' : 'default' }}
                        onClick={() => puedeEditar && handleEvalUpdate(item.documentTypeId, 'estado', item.estado === 'N/A' ? 'SI' : 'N/A')}
                      >
                        {item.estado === 'N/A' ? '—' : '○'}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text fw={600} c="blue">{item.valor}%</Text>
                    </Table.Td>
                    <Table.Td>
                      {item.estado === 'SI' ? (
                        <NumberInput
                          size="xs"
                          min={0}
                          max={item.valor}
                          decimalScale={1}
                          value={item.ponderacion}
                          onChange={(v) => handleEvalUpdate(item.documentTypeId, 'ponderacion', v || 0)}
                          disabled={!puedeEditar}
                          styles={{ input: { width: 70 } }}
                        />
                      ) : (
                        <Text fw={600} c="dimmed" ta="center">0%</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={item.observaciones}
                        onChange={(e) => handleEvalUpdate(item.documentTypeId, 'observaciones', e.currentTarget.value)}
                        disabled={!puedeEditar}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
