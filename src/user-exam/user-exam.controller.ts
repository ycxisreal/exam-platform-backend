import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserExamService } from './user-exam.service';

@Controller('user-exam')
export class UserExamController {
  constructor(private readonly userExamService: UserExamService) {}
  @Post('start/:templateId')
  async startExam(
    @Param('templateId') templateId: number,
    @Body() body: { userId: number },
  ) {
    const exam = await this.userExamService.startExam(body.userId, templateId);

    return {
      examId: exam.userExamId,
      questions: exam.questions,
      createdAt: exam.createdAt,
    };
  }
  @Get(':userExamId')
  async getExamDetail(@Param('userExamId') userExamId: number) {
    return this.userExamService.getExamDetail(userExamId);
  }
  @Post('submit/:userExamId')
  async submitExam(
    @Param('userExamId') userExamId: number,
    @Body()
    body: { answers: { questionId: number; selectedOptionIds: number[] }[] },
  ) {
    return this.userExamService.submitExam(userExamId, body.answers);
  }
  @Get('result/:userExamId')
  getScore(@Param('userExamId') userExamId: number) {
    return this.userExamService.getExamResult(userExamId);
  }
  @Get(':userExamId/wrong-questions')
  async getWrongAnalysis(@Param('userExamId') userExamId: number) {
    return this.userExamService.getWrongQuestions(userExamId);
  }
  @Get('my/records/:userId')
  async getMyExamRecords(@Param('userId') userId: number) {
    return this.userExamService.getUserExamRecords(userId);
  }
  @Get('stats/:userId')
  async getUserExamStats(@Param('userId') userId: number) {
    return this.userExamService.getUserExamStats(userId);
  }
}
