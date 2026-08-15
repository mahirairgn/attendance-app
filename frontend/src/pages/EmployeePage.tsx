import { useEffect, useMemo, useState } from 'react';
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
import { API_URL } from '../lib/api';

const { Title } = Typography;

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
  const [search, setSearch] = useState('');
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
        throw new Error(data.message || 'Failed to load employees');
      }

      setEmployees(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load employees');
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
        throw new Error(data.message || 'Failed to add employee');
      }

      message.success('Employee added successfully');
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
        throw new Error(data.message || 'Failed to save changes');
      }

      message.success('Employee updated successfully');
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
        throw new Error(data.message || 'Failed to update employee status');
      }

      message.success(employee.active ? 'Employee deactivated successfully' : 'Employee activated successfully');
      await fetchEmployees();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update employee status');
    } finally {
      setTogglingId(null);
    }
  }

  const filteredEmployees = useMemo(() => {
  if (!search.trim()) return employees;
  const query = search.trim().toLowerCase();
  return employees.filter((e) =>
    [e.fullName, e.employeeId, e.email, e.position, e.division]
      .some((field) => field.toLowerCase().includes(query))
  );
}, [employees, search]);

  const columns: ColumnsType<Employee> = [
    { title: 'Name', dataIndex: 'fullName' },
    { title: 'ID', dataIndex: 'employeeId' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Position', dataIndex: 'position' },
    { title: 'Division', dataIndex: 'division' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: Employee['role']) => (
        <Tag color={role === 'admin' ? 'purple' : 'default'} variant='outlined'>
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
        <Tag color={active ? 'success' : 'default'} variant='outlined'>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        {
          text: 'Active',
          value: 'true',
        },
        {
          text: 'Inactive',
          value: 'false',
        }
      ],
      onFilter: (value, record) => record.active.toString() === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, employee) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(employee)}>
            Edit
          </Button>

          <Popconfirm
            title={employee.active ? 'Deactivate this employee?' : 'Reactivate this employee?'}
            description={
              employee.active
                ? 'The employee will no longer be able to log in once deactivated.'
                : undefined
            }
            onConfirm={() => toggleActive(employee)}
            okText="Yes"
            cancelText="Cancel"
          >
            <Button
              size="small"
              danger={employee.active}
              icon={employee.active ? <StopOutlined /> : <UndoOutlined />}
              loading={togglingId === employee.id}
            >
              {employee.active ? 'Deactivate' : 'Activate'}
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
          New
        </Button>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <>
          <Input.Search
            placeholder="Search by employee name"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredEmployees}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      <Modal
        title={isAddOpen ? 'Add Employee' : 'Edit Employee'}
        open={isAddOpen || editingEmployee !== null}
        onOk={isAddOpen ? handleAddSubmit : handleEditSubmit}
        onCancel={() => { setIsAddOpen(false); setEditingEmployee(null); }}
        confirmLoading={saving}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="employeeId"
            label="Employee ID"
            rules={[{ required: true, message: 'Employee ID is required' }]}
          >
            <Input value={editingEmployee?.employeeId} disabled={!!editingEmployee?.employeeId} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="position"
            label="Position"
            rules={[{ required: true, message: 'Position is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="division"
            label="Division"
            rules={[{ required: true, message: 'Division is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Role is required' }]}
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
