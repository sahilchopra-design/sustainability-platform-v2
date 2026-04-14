import { useAuth } from '../context/AuthContext';

/**
 * useReadOnly — provides permission flags for read-only enforcement.
 *
 * demo/viewer roles: can view and interact (test inputs) but cannot
 * export data, upload files, or persist analysis results.
 */
export function useReadOnly() {
  const { isReadOnly, user } = useAuth();
  const role = user?.rbac_role || 'viewer';

  return {
    isReadOnly: !!isReadOnly,
    canExport: !isReadOnly && !['demo', 'viewer'].includes(role),
    canUpload: !isReadOnly,
    canSave: !isReadOnly,
    canScheduleReports: !isReadOnly && ['super_admin', 'team_member'].includes(role),
    role,
  };
}

export default useReadOnly;
