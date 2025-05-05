import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ExamTemplate } from 'src/entities/exam-template.entity';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(ExamTemplate)
    private readonly templateRepo: Repository<ExamTemplate>,
  ) {}
  async getAllTemplates(): Promise<ExamTemplate[]> {
    return this.templateRepo.find();
  }
  async getTemplateById(id: number): Promise<ExamTemplate> {
    const template = await this.templateRepo.findOne({
      where: { templateId: id },
    });
    if (!template) throw new NotFoundException('模板不存在');
    return template;
  }
  async createTemplate(data: Partial<ExamTemplate>): Promise<ExamTemplate> {
    const newTemplate = this.templateRepo.create(data);
    return this.templateRepo.save(newTemplate);
  }

  async updateTemplate(
    id: number,
    data: Partial<ExamTemplate>,
  ): Promise<ExamTemplate> {
    const template = await this.getTemplateById(id);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async deleteTemplate(id: number): Promise<void> {
    const result = await this.templateRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('模板不存在');
  }
  async getTemplatesByStatus(
    status: 'upcoming' | 'ongoing' | 'finished',
  ): Promise<ExamTemplate[]> {
    const now = new Date();
    switch (status) {
      case 'upcoming':
        return this.templateRepo.find({
          where: { availableStart: MoreThan(now) },
        });
      case 'ongoing':
        return this.templateRepo.find({
          where: {
            availableStart: LessThan(now),
            availableEnd: MoreThan(now),
          },
        });
      case 'finished':
        return this.templateRepo.find({
          where: { availableEnd: LessThan(now) },
        });
      default:
        throw new BadRequestException('未知的 status');
    }
  }
}
