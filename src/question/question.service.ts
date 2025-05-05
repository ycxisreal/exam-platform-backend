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

  //分类
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

  // 题干
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

  // 选项
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
  async batchCreateOptions(
    questionId: number,
    options: Array<Partial<QuestionOption>>,
  ): Promise<void> {
    const q = await this.qRepo.findOne({ where: { questionId } });
    if (!q) throw new NotFoundException('题目不存在');
    const opts = options.map((opt) =>
      this.optRepo.create({ ...opt, questionId }),
    );
    await this.optRepo.save(opts);
  }
  async getQuestionsByCategory(categoryId: number): Promise<Question[]> {
    return this.qRepo.find({
      where: { categoryId },
      relations: ['category', 'options'],
    });
  }
  async getQuestionsByType(
    questionType: 'single' | 'multiple',
  ): Promise<Question[]> {
    return this.qRepo.find({
      where: { questionType },
      relations: ['category', 'options'],
    });
  }
  async deleteAllOptionsByQuestion(questionId: number): Promise<void> {
    // 先检查题目是否存在
    const q = await this.qRepo.findOne({ where: { questionId } });
    if (!q) throw new NotFoundException('题目不存在');

    // 删除该题目下的所有选项
    await this.optRepo.delete({ questionId });
  }
  //批量添加题目
  async batchCreateQuestions(
    questions: Array<{
      content: string;
      score: number;
      questionType: 'single' | 'multiple';
      categoryId: number;
      options: Array<{ content: string; isCorrect: boolean }>;
    }>,
  ): Promise<Question[]> {
    const createdQuestions = await Promise.all(
      questions.map(async (qData) => {
        // 创建题目
        const question = await this.createQuestion({
          content: qData.content,
          score: qData.score,
          questionType: qData.questionType,
          categoryId: qData.categoryId,
        });
        // 批量创建选项
        await this.batchCreateOptions(question.questionId, qData.options);
        // 返回完整题目（包含选项）
        return this.getQuestionById(question.questionId);
      }),
    );
    return createdQuestions;
  }
}
