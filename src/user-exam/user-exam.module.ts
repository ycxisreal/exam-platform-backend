import { Module } from '@nestjs/common';
import { UserExamController } from './user-exam.controller';
import { UserExamService } from './user-exam.service';

@Module({
  controllers: [UserExamController],
  providers: [UserExamService]
})
export class UserExamModule {}
