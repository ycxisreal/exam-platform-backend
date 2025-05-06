import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question } from 'src/entities/question.entity';
import { QuestionOption } from 'src/entities/question-option.entity';
import { QuestionCategory } from 'src/entities/question-category.entity';
import { UserExamQuestion } from '../entities/user-exam-question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionOption,
      QuestionCategory,
      UserExamQuestion,
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}
