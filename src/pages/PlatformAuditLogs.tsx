import { Card } from 'antd';
import AuditLogTable from '../components/AuditLogTable';
import { platformApi } from '../api/platform';

export default function PlatformAuditLogs() {
  return (
    <Card title="Audit Log">
      <AuditLogTable fetchLogs={platformApi.auditLogs} showCompany />
    </Card>
  );
}
