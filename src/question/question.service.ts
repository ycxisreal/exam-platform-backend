import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from 'src/entities/question.entity';
import { QuestionOption } from 'src/entities/question-option.entity';
import { QuestionCategory } from 'src/entities/question-category.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly qRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optRepo: Repository<QuestionOption>,
    @InjectRepository(QuestionCategory)
    private readonly catRepo: Repository<QuestionCategory>,
  ) {}

  // --- Category ---
  async getAllCategories(): Promise<QuestionCategory[]> {
    return this.catRepo.find();
  }

  async createCategory(
    data: Partial<QuestionCategory>,
  ): Promise<QuestionCategory> {
    const cat = this.catRepo.create(data);
    return this.catRepo.save(cat);
  }

  async updateCategory(
    id: number,
    data: Partial<QuestionCategory>,
  ): Promise<QuestionCategory> {
    const cat = await this.catRepo.findOne({ where: { categoryId: id } });
    if (!cat) throw new NotFoundException('分类不存在');
    Object.assign(cat, data);
    return this.catRepo.save(cat);
  }

  async deleteCategory(id: number): Promise<void> {
    const res = await this.catRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('分类不存在');
  }

  // --- Question ---
  async getAllQuestions(): Promise<Question[]> {
    return this.qRepo.find({ relations: ['category', 'options'] });
  }

  async getQuestionById(id: number): Promise<Question> {
    const q = await this.qRepo.findOne({
      where: { questionId: id },
      relations: ['category', 'options'],
    });
    if (!q) throw new NotFoundException('题目不存在');
    return q;
  }

  async createQuestion(data: Partial<Question>): Promise<Question> {
    const q = this.qRepo.create(data);
    return this.qRepo.save(q);
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question> {
    const q = await this.getQuestionById(id);
    Object.assign(q, data);
    return this.qRepo.save(q);
  }

  async deleteQuestion(id: number): Promise<void> {
    const res = await this.qRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('题目不存在');
  }

  // --- Option ---
  async getOptionsByQuestion(questionId: number): Promise<QuestionOption[]> {
    return this.optRepo.find({ where: { questionId } });
  }

  async createOption(
    questionId: number,
    data: Partial<QuestionOption>,
  ): Promise<QuestionOption> {
    const opt = this.optRepo.create({ ...data, questionId });
    return this.optRepo.save(opt);
  }

  async updateOption(
    id: number,
    data: Partial<QuestionOption>,
  ): Promise<QuestionOption> {
    const opt = await this.optRepo.findOne({ where: { optionId: id } });
    if (!opt) throw new NotFoundException('选项不存在');
    Object.assign(opt, data);
    return this.optRepo.save(opt);
  }

  async deleteOption(id: number): Promise<void> {
    const res = await this.optRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('选项不存在');
  }
}
