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
  @Post('batch')
  async batchCreateQuestions(
    @Body()
    questions: Array<{
      content: string;
      score: number;
      questionType: 'single' | 'multiple';
      categoryId: number;
      options: Array<{ content: string; isCorrect: boolean }>;
    }>,
  ) {
    const createdQuestions = await this.svc.batchCreateQuestions(questions);
    return {
      message: '题目批量导入成功',
      data: createdQuestions,
    };
  }
  @Get('category/:categoryId')
  getByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<Question[]> {
    return this.svc.getQuestionsByCategory(categoryId);
  }
  @Get('type/:type')
  getByType(@Param('type') type: 'single' | 'multiple'): Promise<Question[]> {
    return this.svc.getQuestionsByType(type);
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
  @Post(':questionId/options/batch')
  async batchCreateOptions(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body('options') options: Array<Partial<QuestionOption>>,
  ) {
    await this.svc.batchCreateOptions(questionId, options);
    return { message: '选项添加成功' };
  }
  //删除某一题目id的所有选项
  @Delete(':questionId/options')
  async removeAllOptions(
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<void> {
    return this.svc.deleteAllOptionsByQuestion(questionId);
  }
}
