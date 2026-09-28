import { useEffect, useRef, useState } from 'react';
import { Upload, Input, Button, Space, Image, Typography, Empty, Tooltip, message } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { uploadsApi } from '../api/uploads';
import type { ProductImageInput } from '../types';

interface ProductImagesFieldProps {
  /** Current image list (injected by Form.Item). */
  value?: ProductImageInput[];
  /** Called whenever the image list changes (injected by Form.Item). */
  onChange?: (value: ProductImageInput[]) => void;
}

/**
 * Form control that manages the full list of images for a product: upload one or
 * many files at once, paste URLs, mark one image as primary and remove images.
 */
export default function ProductImagesField({ value, onChange }: ProductImagesFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const images = value ?? [];

  // The latest list, kept in a ref so async uploads never merge into a snapshot
  // captured during an earlier render.
  const imagesRef = useRef<ProductImageInput[]>(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: ProductImageInput[]) => {
    imagesRef.current = next;
    onChange?.(next);
  };

  /** Appends URLs that aren't already present. Returns how many were added. */
  const addUrls = (urls: string[]): number => {
    const base = imagesRef.current;
    const existing = new Set(base.map((img) => img.url));
    const fresh = urls
      .map((u) => u.trim())
      .filter((u) => u && !existing.has(u))
      .map((url) => ({ url, is_primary: false }));

    if (fresh.length === 0) return 0;
    commit([...base, ...fresh]);
    return fresh.length;
  };

  // Files chosen in a single picker interaction are collected here and uploaded as
  // one batch, so the resulting URLs are merged in a single update.
  const pendingFiles = useRef<File[]>([]);
  const flushScheduled = useRef(false);

  const queueFile = (file: File) => {
    pendingFiles.current.push(file);
    if (flushScheduled.current) return;

    flushScheduled.current = true;
    // beforeUpload fires once per selected file in the same tick — flush after them.
    setTimeout(() => {
      flushScheduled.current = false;
      const batch = pendingFiles.current;
      pendingFiles.current = [];
      void uploadBatch(batch);
    }, 0);
  };

  const uploadBatch = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await uploadsApi.uploadImage(file);
            return res.url;
          } catch {
            return null;
          }
        }),
      );

      const urls = results.filter((url): url is string => url !== null);
      const failed = results.length - urls.length;

      const added = addUrls(urls);

      if (added > 0) {
        message.success(`${added} image${added > 1 ? 's' : ''} uploaded`);
      }
      if (failed > 0) {
        message.error(`${failed} file${failed > 1 ? 's' : ''} failed to upload`);
      }
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = (index: number) => {
    commit(imagesRef.current.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const removeAt = (index: number) => {
    const current = imagesRef.current;
    const next = current.filter((_, i) => i !== index);
    // Keep a primary image whenever at least one image remains.
    if (current[index]?.is_primary && next.length > 0) {
      next[0] = { ...next[0], is_primary: true };
    }
    commit(next);
  };

  const addFromInput = () => {
    addUrls([urlInput]);
    setUrlInput('');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Space wrap>
        <Upload
          accept="image/*"
          multiple
          showUploadList={false}
          beforeUpload={(file) => {
            // Collect every file of this selection; the batch is uploaded together.
            queueFile(file as unknown as File);
            return false; // we handle the upload ourselves
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? 'Uploading…' : 'Upload images'}
          </Button>
        </Upload>
        <Input
          placeholder="Paste an image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onPressEnter={addFromInput}
          style={{ width: 220 }}
        />
        <Button icon={<PlusOutlined />} onClick={addFromInput} disabled={!urlInput.trim()}>
          Add URL
        </Button>
      </Space>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Star one image to make it the primary image. If none is selected, one is picked at random.
      </Typography.Text>

      {images.length === 0 ? (
        <Empty description="No images" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {images.map((img, index) => (
            <Space
              key={`${img.url}-${index}`}
              align="center"
              style={{
                width: '100%',
                padding: 6,
                borderRadius: 8,
                border: img.is_primary ? '1px solid #1677ff' : '1px solid #f0f0f0',
              }}
            >
              <Image
                src={img.url}
                width={44}
                height={44}
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
              <Typography.Text style={{ maxWidth: 220 }} ellipsis>
                {img.url}
              </Typography.Text>
              <Tooltip title={img.is_primary ? 'Primary image' : 'Set as primary'}>
                <Button
                  size="small"
                  type={img.is_primary ? 'primary' : 'default'}
                  icon={img.is_primary ? <StarFilled /> : <StarOutlined />}
                  onClick={() => setPrimary(index)}
                />
              </Tooltip>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAt(index)}
              />
            </Space>
          ))}
        </Space>
      )}
    </Space>
  );
}
