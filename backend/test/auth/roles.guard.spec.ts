import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { UserRole } from '../../src/database/entities';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (userRole?: UserRole) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn().mockReturnValue({
      user: userRole ? { role: userRole } : undefined,
    }),
  } as any);

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = rolesGuard.canActivate(mockExecutionContext(UserRole.STUDENT));

    expect(result).toBe(true);
  });

  it('should allow admin to access admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const result = rolesGuard.canActivate(mockExecutionContext(UserRole.ADMIN));

    expect(result).toBe(true);
  });

  it('should deny student access to admin routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(() => rolesGuard.canActivate(mockExecutionContext(UserRole.STUDENT)))
      .toThrow(ForbiddenException);
  });

  it('should allow access with multiple roles OR condition', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.HEAD]);

    const result = rolesGuard.canActivate(mockExecutionContext(UserRole.HEAD));

    expect(result).toBe(true);
  });

  it('should deny access if user has none of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.HEAD]);

    expect(() => rolesGuard.canActivate(mockExecutionContext(UserRole.STUDENT)))
      .toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if no user is found in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(() => rolesGuard.canActivate(mockExecutionContext(undefined)))
      .toThrow(ForbiddenException);
  });

  it('should deny SUPER_ADMIN when route requires exact ADMIN role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    expect(() => rolesGuard.canActivate(mockExecutionContext(UserRole.SUPER_ADMIN)))
      .toThrow(ForbiddenException);
  });

  it('should allow DOCTOR to access routes requiring DOCTOR or TA', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DOCTOR, UserRole.TA]);

    const result = rolesGuard.canActivate(mockExecutionContext(UserRole.DOCTOR));

    expect(result).toBe(true);
  });

  it('should deny TA from accessing DOCTOR-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DOCTOR]);

    expect(() => rolesGuard.canActivate(mockExecutionContext(UserRole.TA)))
      .toThrow(ForbiddenException);
  });
});
