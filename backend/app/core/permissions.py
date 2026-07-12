from enum import Enum
from typing import Mapping, Set


class Permission(str, Enum):
    CUSTOMER_VIEW = "customer:view"
    CUSTOMER_CREATE = "customer:create"
    CUSTOMER_UPDATE = "customer:update"
    CUSTOMER_DELETE = "customer:delete"
    JOB_VIEW = "job:view"
    JOB_CREATE = "job:create"
    JOB_UPDATE = "job:update"
    JOB_DELETE = "job:delete"
    TASK_CREATE = "task:create"
    TASK_ASSIGN = "task:assign"
    COMMENT_CREATE = "comment:create"
    COMMENT_DELETE_OWN = "comment:delete_own"
    COMMENT_DELETE_ANY = "comment:delete_any"
    REPORT_EXPORT = "report:export"
    TEAM_MANAGE = "team:manage"
    WORKSPACE_MANAGE = "workspace:manage"
    FILE_VIEW = "file:view"
    FILE_WRITE = "file:write"
    FILE_DELETE = "file:delete"
    REQUEST_VIEW = "request:view"
    REQUEST_WRITE = "request:write"
    REQUEST_DELETE = "request:delete"
    DELIVERY_VIEW = "delivery:view"
    DELIVERY_WRITE = "delivery:write"
    DELIVERY_DELETE = "delivery:delete"
    OFFER_VIEW = "offer:view"
    OFFER_WRITE = "offer:write"
    OFFER_DELETE = "offer:delete"


ALL_PERMISSIONS: Set[Permission] = set(Permission)

ROLE_ALIASES = {
    "founder": "owner",
    "kurucu": "owner",
    "personnel": "staff",
}


def normalize_role(role: str | None) -> str | None:
    if not role:
        return None
    normalized = role.strip().lower()
    return ROLE_ALIASES.get(normalized, normalized)

ROLE_PERMISSIONS: Mapping[str, Set[Permission]] = {
    "owner": ALL_PERMISSIONS,
    "admin": ALL_PERMISSIONS,
    "manager": {
        Permission.CUSTOMER_VIEW,
        Permission.CUSTOMER_CREATE,
        Permission.CUSTOMER_UPDATE,
        Permission.CUSTOMER_DELETE,
        Permission.JOB_VIEW,
        Permission.JOB_CREATE,
        Permission.JOB_UPDATE,
        Permission.JOB_DELETE,
        Permission.TASK_CREATE,
        Permission.TASK_ASSIGN,
        Permission.COMMENT_CREATE,
        Permission.COMMENT_DELETE_OWN,
        Permission.REPORT_EXPORT,
        Permission.FILE_VIEW, Permission.FILE_WRITE, Permission.FILE_DELETE,
        Permission.REQUEST_VIEW, Permission.REQUEST_WRITE, Permission.REQUEST_DELETE,
        Permission.DELIVERY_VIEW, Permission.DELIVERY_WRITE, Permission.DELIVERY_DELETE,
        Permission.OFFER_VIEW, Permission.OFFER_WRITE, Permission.OFFER_DELETE,
    },
    "staff": {
        Permission.CUSTOMER_VIEW,
        Permission.JOB_VIEW,
        Permission.TASK_CREATE,
        Permission.COMMENT_CREATE,
        Permission.COMMENT_DELETE_OWN,
        Permission.FILE_VIEW, Permission.FILE_WRITE,
        Permission.REQUEST_VIEW, Permission.REQUEST_WRITE,
        Permission.DELIVERY_VIEW,
    },
    "viewer": {
        Permission.CUSTOMER_VIEW,
        Permission.JOB_VIEW,
        Permission.FILE_VIEW, Permission.REQUEST_VIEW, Permission.DELIVERY_VIEW, Permission.OFFER_VIEW,
    },
}


def has_permission(role: str | None, permission: Permission) -> bool:
    role = normalize_role(role)
    if not role:
        return False
    return permission in ROLE_PERMISSIONS.get(role, set())
