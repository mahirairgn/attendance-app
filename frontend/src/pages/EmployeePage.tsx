import { useEffect, useState } from 'react';
import { 
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, PlusOutlined, StopOutlined, UndoOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API_URL = 'http://localhost:3000';

interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  position: string;
  division: string;
  role: 'admin' | 'employee';
  active: boolean;
}

interface EditFormValues {
  employeeId: string;
  name: string;
  email: string;
  position: string;
  division: string;
  role: 'admin' | 'employee';
}

function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form] = Form.useForm<EditFormValues>();

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil data karyawan');
      }

      setEmployees(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal mengambil data karyawan');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    form.resetFields();
    setEditingEmployee(null);
    setIsAddOpen(true);
  }

  async function handleAddSubmit() {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch(`${API_URL}/employees/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambahkan karyawan');
      }

      message.success('Karyawan berhasil ditambahkan');
      setIsAddOpen(false);
      await fetchEmployees();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(employee: Employee) {
    setEditingEmployee(employee);
    form.setFieldsValue({
      employeeId: employee.employeeId,
      name: employee.fullName,
      email: employee.email,
      position: employee.position,
      division: employee.division,
      role: employee.role,
    });
  }

  async function handleEditSubmit() {
    if (!editingEmployee) return;

    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch(`${API_URL}/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan perubahan');
      }

      message.success('Data karyawan diperbarui');
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(employee: Employee) {
    setTogglingId(employee.id);

    try {
      const res = await fetch(`${API_URL}/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ active: !employee.active }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah status karyawan');
      }

      message.success(employee.active ? 'Karyawan dinonaktifkan' : 'Karyawan diaktifkan kembali');
      await fetchEmployees();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal mengubah status karyawan');
    } finally {
      setTogglingId(null);
    }
  }

  const columns: ColumnsType<Employee> = [
    { title: 'Nama', dataIndex: 'fullName' },
    { title: 'ID', dataIndex: 'employeeId' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Posisi', dataIndex: 'position' },
    { title: 'Divisi', dataIndex: 'division' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: Employee['role']) => (
        <Tag color={role === 'admin' ? 'purple' : 'default'}>
          {role === 'admin' ? 'Admin' : 'Employee'}
        </Tag>
      ),
        filters: [
        {
          text: 'Admin',
          value: 'admin',
        },
        {
          text: 'Employee',
          value: 'employee',
        }
      ],
      onFilter: (value, record) => record.role.toString() === value,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? 'Aktif' : 'Nonaktif'}</Tag>
      ),
      filters: [
        {
          text: 'Aktif',
          value: 'true',
        },
        {
          text: 'Nonaktif',
          value: 'false',
        }
      ],
      onFilter: (value, record) => record.active.toString() === value,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, employee) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(employee)}>
            Edit
          </Button>

          <Popconfirm
            title={employee.active ? 'Nonaktifkan karyawan ini?' : 'Aktifkan kembali karyawan ini?'}
            description={
              employee.active
                ? 'Karyawan tidak akan bisa login setelah dinonaktifkan.'
                : undefined
            }
            onConfirm={() => toggleActive(employee)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button
              size="small"
              danger={employee.active}
              icon={employee.active ? <StopOutlined /> : <UndoOutlined />}
              loading={togglingId === employee.id}
            >
              {employee.active ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div class-name="employee-page">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Employee
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openAdd()}
        >
          Tambah Karyawan
        </Button>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={employees}
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={isAddOpen ? 'Tambah Karyawan' : 'Edit Karyawan'}
        open={isAddOpen || editingEmployee !== null}
        onOk={isAddOpen ? handleAddSubmit : handleEditSubmit}
        onCancel={() => { setIsAddOpen(false); setEditingEmployee(null); }}
        confirmLoading={saving}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="employeeId"
            label="ID Karyawan"
            rules={[{ required: true, message: 'ID Karyawan wajib diisi' }]}
          >
            <Input value={editingEmployee?.employeeId} disabled={!!editingEmployee?.employeeId} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nama"
            rules={[{ required: true, message: 'Nama wajib diisi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="position"
            label="Posisi"
            rules={[{ required: true, message: 'Posisi wajib diisi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="division"
            label="Divisi"
            rules={[{ required: true, message: 'Divisi wajib diisi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Role wajib dipilih' }]}
          >
            <Select
              value={role}
              onChange={(value) => setRole(value)}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EmployeePage;
