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
import { TemplateService } from './template.service';
import { ExamTemplate } from 'src/entities/exam-template.entity';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  getAll(): Promise<ExamTemplate[]> {
    return this.templateService.getAllTemplates();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<ExamTemplate> {
    return this.templateService.getTemplateById(id);
  }

  @Post()
  create(@Body() data: Partial<ExamTemplate>): Promise<ExamTemplate> {
    return this.templateService.createTemplate(data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ExamTemplate>,
  ): Promise<ExamTemplate> {
    return this.templateService.updateTemplate(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.templateService.deleteTemplate(id);
  }
  @Get('status/:status')
  getByStatus(
    @Param('status') status: 'upcoming' | 'ongoing' | 'finished',
  ): Promise<ExamTemplate[]> {
    return this.templateService.getTemplatesByStatus(status);
  }
  @Get('stats/count')
  async getTemplateCount() {
    return this.templateService.getTemplateStats();
  }
}
