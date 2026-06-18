export interface Role {
  id: string;
  name: 'admin' | 'user' | string;
  display_name: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface AppModule {
  id: string;
  key: string;
  name: string;
  description: string;
  route: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  module_id: string | null;
  key: string;
  name: string;
  description: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  permission?: Permission;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  role?: Role;
}

export interface UserModule {
  id: string;
  user_id: string;
  module_id: string;
  assigned_by: string | null;
  assigned_at: string;
  module?: AppModule;
}

export interface MyAccessRow {
  role_name: string;
  module_key: string | null;
  permission_key: string | null;
}
