import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, message, Card, Drawer, Image, Descriptions, Empty, Tag, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { productsApi } from '../api/products';
import { useAuth } from '../contexts/AuthContext';
import ProductImagesField from '../components/ProductImagesField';
import TruncatedText from '../components/TruncatedText';
import type { Product, ProductImageInput } from '../types';

export default function Products() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Product created');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description?: string; price?: number; low_stock_threshold?: number; images?: ProductImageInput[] }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Product updated');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Product deleted');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    form.setFieldsValue(product);
    setModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editing) {
        updateMutation.mutate({ id: editing.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    });
  };

  const columns = [
    {
      title: 'Image',
      key: 'image_url',
      width: 80,
      render: (_: unknown, record: Product) =>
        record.image_url ? (
          <Image src={record.image_url} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (name: string, record: Product) => (
        <Space size={4}>
          <TruncatedText text={name} />
          {(record.images?.length ?? 0) > 1 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              +{(record.images?.length ?? 0) - 1}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: 'Low stock at',
      dataIndex: 'low_stock_threshold',
      key: 'low_stock_threshold',
      width: 120,
      render: (v: number) =>
        v > 0 ? `< ${v}` : <Typography.Text type="secondary">off</Typography.Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => setViewing(record)} />
          {hasPermission('products.edit') && (
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          )}
          {hasPermission('products.delete') && (
            <Popconfirm title="Delete this product?" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Products"
        extra={hasPermission('products.create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Product</Button>
        )}
      >
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, total: data?.total ?? 0 }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Product' : 'Create Product'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="images" label="Images">
            <ProductImagesField />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="low_stock_threshold"
            label="Low stock threshold"
            initialValue={50}
            tooltip="Flag this product as low stock on the dashboard when its quantity at an inventory drops below this value. Set 0 to disable."
            rules={[{ type: 'number', min: 0, message: 'Threshold cannot be negative' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Product Details"
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={420}
      >
        {viewing && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {(viewing.images?.length ?? 0) > 0 ? (
              <Image.PreviewGroup>
                <Space wrap size="middle">
                  {viewing.images!.map((img) => (
                    <div key={img.id ?? img.url} style={{ textAlign: 'center' }}>
                      <Image
                        src={img.url}
                        width={104}
                        height={104}
                        style={{
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: img.is_primary ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        }}
                      />
                      {img.is_primary && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">Primary</Tag>
                        </div>
                      )}
                    </div>
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty description="No images" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Name">{viewing.name}</Descriptions.Item>
              <Descriptions.Item label="Description">{viewing.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="Price">${viewing.price.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Low stock threshold">
                {viewing.low_stock_threshold > 0 ? `< ${viewing.low_stock_threshold}` : 'Not monitored'}
              </Descriptions.Item>
              <Descriptions.Item label="Images">{viewing.images?.length ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Created">{new Date(viewing.created_at).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Updated">{new Date(viewing.updated_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>
    </>
  );
}
