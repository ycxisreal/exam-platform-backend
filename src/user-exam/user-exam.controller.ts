import { Controller } from '@nestjs/common';
import { UserExamService } from './user-exam.service';

@Controller('user-exam')
export class UserExamController {
  constructor(private readonly userExamService: UserExamService) {}
}
