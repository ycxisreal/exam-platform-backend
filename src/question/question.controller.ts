import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { Question } from 'src/entities/question.entity';
import { QuestionOption } from 'src/entities/question-option.entity';
import { QuestionCategory } from 'src/entities/question-category.entity';

@Controller('question')
export class QuestionController {
  constructor(private readonly svc: QuestionService) {}

  //分类
  @Get('categories')
  getAllCategories(): Promise<QuestionCategory[]> {
    return this.svc.getAllCategories();
  }
  @Post('categories')
  createCategory(
    @Body() data: Partial<QuestionCategory>,
  ): Promise<QuestionCategory> {
    return this.svc.createCategory(data);
  }
  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<QuestionCategory>,
  ): Promise<QuestionCategory> {
    return this.svc.updateCategory(id, data);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.svc.deleteCategory(id);
  }

  //题库
  @Get()
  getAllQuestions(): Promise<Question[]> {
    return this.svc.getAllQuestions();
  }

  @Get(':id')
  getQuestionById(@Param('id', ParseIntPipe) id: number): Promise<Question> {
    return this.svc.getQuestionById(id);
  }

  @Post()
  createQuestion(@Body() data: Partial<Question>): Promise<Question> {
    return this.svc.createQuestion(data);
  }

  @Patch(':id')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Question>,
  ): Promise<Question> {
    return this.svc.updateQuestion(id, data);
  }

  @Delete(':id')
  removeQuestion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.svc.deleteQuestion(id);
  }

  //选项
  @Get(':questionId/options')
  getOptions(
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<QuestionOption[]> {
    return this.svc.getOptionsByQuestion(questionId);
  }

  @Post(':questionId/options')
  createOption(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() data: Partial<QuestionOption>,
  ): Promise<QuestionOption> {
    return this.svc.createOption(questionId, data);
  }

  @Patch('options/:id')
  updateOption(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<QuestionOption>,
  ): Promise<QuestionOption> {
    return this.svc.updateOption(id, data);
  }

  @Delete('options/:id')
  removeOption(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.svc.deleteOption(id);
  }
}
