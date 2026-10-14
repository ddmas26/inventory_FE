import { Card } from 'antd';
import AuditLogTable from '../components/AuditLogTable';
import { auditApi } from '../api/audit';

export default function Activity() {
  return (
    <Card title="Activity">
      <AuditLogTable fetchLogs={auditApi.list} />
    </Card>
  );
}
