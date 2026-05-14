import * as React from "react";
import { cn } from "@/app/lib/admin/utils";
type PermissionGroupProps = {
  title: string;
  permissions: string[];

  selectedPermissions: string[];

  onToggle: (permission: string) => void;
};

type PermissionListProps = {
  permissionGroups: Record<string, string[]>;

  selectedPermissions: string[];

  onToggle: (permission: string) => void;
};

export function PermissionGroup({
  title,
  permissions,
  selectedPermissions,
  onToggle,
}: PermissionGroupProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4 transition hover:border-primary/40">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium tracking-tight">{title}</h3>

        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {permissions.length}
        </span>
      </div>

      {/* Permission List */}
      <div className="space-y-3">
        {permissions.map((permission) => (
          <label
            key={permission}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selectedPermissions.includes(permission)}
              onChange={() => onToggle(permission)}
              className="h-4 w-4 rounded border"
            />

            <span className="capitalize">
              {permission.replaceAll("_", " ")}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
export function PermissionList({
  permissionGroups,
  selectedPermissions,
  onToggle,
}: PermissionListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(permissionGroups).map(([group, permissions]) => (
        <PermissionGroup
          key={group}
          title={group}
          permissions={permissions}
          selectedPermissions={selectedPermissions}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
