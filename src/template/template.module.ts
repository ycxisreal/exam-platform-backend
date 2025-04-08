import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { ExamTemplate } from 'src/entities/exam-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamTemplate])],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
