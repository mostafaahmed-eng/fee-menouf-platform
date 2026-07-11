import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { RbacService } from './rbac.service';
import { RbacGuard } from './rbac.guard';
import { User } from '../database/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User])],
  providers: [RbacService, RbacGuard],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}
