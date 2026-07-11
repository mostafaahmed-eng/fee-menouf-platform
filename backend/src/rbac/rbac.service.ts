import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { Permission, PermissionAction } from './permission.entity';
import { User, UserRole } from '../database/entities/user.entity';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createRole(name: string, description?: string): Promise<Role> {
    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error('Role not found');
    }
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = permissions.map((p) => `${p.resource}:${p.action}`);
    await this.roleRepository.save(role);
  }

  async createPermission(
    resource: string,
    action: PermissionAction,
    description?: string,
  ): Promise<Permission> {
    const permission = this.permissionRepository.create({ resource, action, description });
    return this.permissionRepository.save(permission);
  }

  async userHasPermission(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const roleBasedPermissions = this.getRoleDefaultPermissions(user.role);
    return requiredPermissions.every((perm) => roleBasedPermissions.includes(perm));
  }

  getRoleDefaultPermissions(role: UserRole): string[] {
    const permissionsMap: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: ['*:*'],
      [UserRole.ADMIN]: [
        'users:read', 'users:create', 'users:update', 'users:delete',
        'courses:read', 'courses:create', 'courses:update', 'courses:delete',
        'departments:read', 'departments:create', 'departments:update',
        'registrations:read', 'registrations:create', 'registrations:update',
        'grades:read', 'grades:create', 'grades:update',
      ],
      [UserRole.HEAD]: [
        'users:read', 'courses:read', 'courses:create', 'courses:update',
        'departments:read', 'registrations:read', 'registrations:update',
        'grades:read', 'grades:update',
      ],
      [UserRole.DOCTOR]: [
        'courses:read', 'grades:create', 'grades:read', 'grades:update',
        'attendance:create', 'attendance:read',
        'materials:create', 'materials:read', 'materials:update',
        'announcements:create', 'announcements:read',
      ],
      [UserRole.TA]: [
        'courses:read', 'grades:read',
        'attendance:create', 'attendance:read',
        'materials:read',
      ],
      [UserRole.ADVISOR]: [
        'users:read', 'registrations:read', 'registrations:update',
        'grades:read',
      ],
      [UserRole.STUDENT]: [
        'courses:read', 'grades:read', 'attendance:read',
        'registrations:read', 'registrations:create',
        'materials:read',
      ],
    };
    return permissionsMap[role] || [];
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }
    return this.getRoleDefaultPermissions(user.role);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }
}
