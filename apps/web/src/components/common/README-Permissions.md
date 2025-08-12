# Permission System Usage Guide

This guide explains how to use the permission system implemented in the application.

## Components Overview

### 1. PermissionsContext

The main context that manages user permissions throughout the application. It:

- Fetches user data using `getUsuarioByCookie`
- Retrieves role permissions using `getPermissionsRole`
- Provides permission validation functions
- Handles super admin privileges

### 2. PermissionGuard

A component that conditionally renders children based on permissions:

```tsx
<PermissionGuard requiredModule="usuarios">
  <SomeComponent />
</PermissionGuard>
```

### 3. ProtectedRoute

A wrapper component for protecting entire routes:

```tsx
<ProtectedRoute requiredModule="clientes">
  <ClientesPage />
</ProtectedRoute>
```

## Usage Examples

### Protecting Routes

Wrap route components with `ProtectedRoute`:

```tsx
// In a route component
import { ProtectedRoute } from "../../../components/common/ProtectedRoute";

function RouteComponent() {
  return (
    <ProtectedRoute requiredModule="usuarios">
      <Section>{/* Your route content */}</Section>
    </ProtectedRoute>
  );
}
```

### Conditional Component Rendering

Use `PermissionGuard` for granular permission control:

```tsx
<PermissionGuard requiredModule="usuarios">
  <ButtonAction Icon={PlusIcon} label="Add User" onClick={handleAddUser} />
</PermissionGuard>
```

### Using Permissions Hook

Access permissions programmatically:

```tsx
import { usePermissions } from "../../context/PermissionsContext";

function MyComponent() {
  const { hasPermission, isSuperAdmin, currentUser } = usePermissions();

  if (isSuperAdmin) {
    // Super admin logic
  }

  if (hasPermission("usuarios")) {
    // User management logic
  }

  return <div>...</div>;
}
```

## Permission Module Names

The following module names are used for permission checks:

- `dashboard` - Dashboard access
- `usuarios` - User management
- `permisos` - Permissions and roles
- `configuracion` - Configuration settings
- `clientes` - Client management
- `personal` - Personnel management
- `programaciones` - Scheduling
- `servicios` - Services
- `tarifas` - Pricing/Rates
- `ordenes-de-servicio` - Service orders
- `reportes` - Reports

## Super Admin Privileges

Super admins automatically have access to all modules without exception. The system checks for super admin status using:

- Role name matching: 'super-admin', 'superadmin', 'administrador'
- Role ID: 1 (assuming role ID 1 is super admin)

## Error Handling

When a user lacks permissions, the system displays:

```
"Usted no tiene permisos para esta ruta."
```

Along with a user-friendly error message suggesting to contact the administrator.

## Integration Notes

1. **Sidebar Navigation**: Automatically filters menu items based on permissions
2. **Route Protection**: Prevents unauthorized access to protected routes
3. **Component-Level**: Allows fine-grained control over UI elements
4. **Loading States**: Handles permission loading gracefully

## API Dependencies

The system relies on:

- `getUsuarioByCookie()` - Fetches current user with role information
- `getPermissionsRole(roleId)` - Fetches permissions for a specific role
