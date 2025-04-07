import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
