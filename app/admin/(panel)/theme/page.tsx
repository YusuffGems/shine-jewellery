"use client";
import { RequirePermission } from "@/admin/layout/AdminShell";
import { ThemeBuilder } from "@/admin/components/theme/ThemeBuilder";

export default function ThemePage() {
  return (
    <RequirePermission perm="theme.read">
      <ThemeBuilder />
    </RequirePermission>
  );
}
