export function getEntityPath(entityType?: string | null, entityId?: number | null): string | null {
  if (!entityType || !entityId) return null;
  const routes: Record<string, string> = {
    customer: `/customers/${entityId}`,
    job: `/jobs/${entityId}`,
    task: '/tasks',
    offer: '/offers',
    file: '/files',
    finance_entry: '/finance',
    delivery_service: '/delivery-service',
    request_ticket: '/complaints',
  };
  return routes[entityType] ?? null;
}
