export type Permission =
  | 'customer:view'
  | 'customer:create'
  | 'customer:update'
  | 'customer:delete'
  | 'job:view'
  | 'job:create'
  | 'job:update'
  | 'job:delete'
  | 'task:create'
  | 'task:assign'
  | 'comment:create'
  | 'comment:delete_own'
  | 'comment:delete_any'
  | 'report:export'
  | 'team:manage'
  | 'workspace:manage';

const ALL_PERMISSIONS: Permission[] = [
  'customer:view', 'customer:create', 'customer:update', 'customer:delete',
  'job:view', 'job:create', 'job:update', 'job:delete',
  'task:create', 'task:assign',
  'comment:create', 'comment:delete_own', 'comment:delete_any',
  'report:export', 'team:manage', 'workspace:manage',
];

const ROLE_PERMISSIONS: Record<string, ReadonlySet<Permission>> = {
  owner: new Set(ALL_PERMISSIONS),
  admin: new Set(ALL_PERMISSIONS),
  manager: new Set([
    'customer:view', 'customer:create', 'customer:update', 'customer:delete',
    'job:view', 'job:create', 'job:update', 'job:delete',
    'task:create', 'task:assign',
    'comment:create', 'comment:delete_own', 'report:export',
  ]),
  staff: new Set([
    'customer:view', 'job:view', 'task:create', 'comment:create', 'comment:delete_own',
  ]),
  viewer: new Set(['customer:view', 'job:view']),
};

const ROLE_ALIASES: Record<string, string> = {
  founder: 'owner',
  kurucu: 'owner',
  personnel: 'staff',
};

export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? normalized;
}

export function can(
  role: string | null | undefined,
  permission: Permission,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  const canonicalRole = normalizeRole(role);
  if (!canonicalRole) return false;
  return ROLE_PERMISSIONS[canonicalRole]?.has(permission) ?? false;
}
