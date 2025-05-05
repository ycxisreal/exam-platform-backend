import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserExamController } from './user-exam.controller';
import { UserExamService } from './user-exam.service';
import { UserExam } from 'src/entities/user-exam.entity';
import { UserExamQuestion } from 'src/entities/user-exam-question.entity';
import { ExamTemplate } from 'src/entities/exam-template.entity';
import { Question } from 'src/entities/question.entity';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserExam,
      UserExamQuestion,
      ExamTemplate,
      Question,
    ]),
  ],
  controllers: [UserExamController],
  providers: [
    UserExamService,
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
  ],
})
export class UserExamModule {}
