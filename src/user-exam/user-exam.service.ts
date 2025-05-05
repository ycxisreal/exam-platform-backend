import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserExam } from '../entities/user-exam.entity';
import { UserExamQuestion } from '../entities/user-exam-question.entity';
import { ExamTemplate } from '../entities/exam-template.entity';
import { Question } from '../entities/question.entity';

@Injectable()
export class UserExamService {
  constructor(
    @Inject('DATA_SOURCE')
    private dataSource: DataSource,

    @InjectRepository(UserExam)
    private userExamRepo: Repository<UserExam>,

    @InjectRepository(UserExamQuestion)
    private userExamQuestionRepo: Repository<UserExamQuestion>,

    @InjectRepository(ExamTemplate)
    private templateRepo: Repository<ExamTemplate>,

    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}
  async startExam(userId: number, templateId: number) {
    const template = await this.templateRepo.findOne({
      where: { templateId },
      relations: ['userExams'],
    });

    if (!template) {
      throw new NotFoundException('考试模板不存在');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. 生成试卷题目
      const questions =
        template.examType === 'normal'
          ? await this.generateNormalExam(userId, template)
          : await this.generateSpecialExam(template);

      // 2. 创建主考试记录
      const userExam = manager.create(UserExam, {
        userId,
        templateId,
        status: 'pending',
        createdAt: new Date(),
      });
      await manager.save(userExam);

      // 3. 创建考试题目关联记录
      const examQuestions = questions.map((q) =>
        manager.create(UserExamQuestion, {
          userExamId: userExam.userExamId,
          questionId: q.questionId,
          categoryId: q.categoryId,
          score: q.score,
          isCorrect: false, // 初始状态，阅卷后更新
          selectedOptionIds: [], // 初始为空数组
        }),
      );

      await manager.save(examQuestions);

      // 4. 返回完整考试信息
      return {
        ...userExam,
        questions: questions.map((q) => ({
          ...q,
          options: q.options, // 假设Question实体中有options关联
        })),
      };
    });
  }

  private async generateNormalExam(
    userId: number,
    template: ExamTemplate,
  ): Promise<Question[]> {
    // 获取用户错题分类
    const wrongCategories = await this.getWrongCategories(userId);
    // 获取需要排除的题目ID
    const excludedIds = await this.getExcludedQuestionIds(userId);

    const requiredCount = this.getRequiredCount(template);
    let questions: Question[] = [];

    // 1. 优先从错题分类抽题（如果有错题分类）
    if (wrongCategories.length > 0) {
      questions = await this.tryGenerateQuestions(
        wrongCategories,
        template.singleChoiceCount,
        template.multipleChoiceCount,
        excludedIds,
      );
    }

    // 2. 如果题目不足，从所有分类补充（包括错题分类）
    if (questions.length < requiredCount) {
      const remainingCount = requiredCount - questions.length;
      const fallbackQuestions = await this.getFallbackQuestions(
        [], // 不再排除任何分类，从所有分类中抽取
        remainingCount,
        [...excludedIds, ...questions.map((q) => q.questionId)], // 排除已选题目
      );
      questions = [...questions, ...fallbackQuestions];
    }

    // 3. 如果仍然不足（极端情况），从所有可用题目中抽取
    if (questions.length < requiredCount) {
      const remainingCount = requiredCount - questions.length;
      const emergencyQuestions = await this.questionRepo
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.options', 'options')
        .where({
          questionId: Not(
            In([...excludedIds, ...questions.map((q) => q.questionId)]),
          ),
        })
        .orderBy('RAND()')
        .limit(remainingCount)
        .getMany();
      questions = [...questions, ...emergencyQuestions];
    }
    return questions.slice(0, requiredCount); // 确保不会返回超过需要的数量
  }
  private async generateSpecialExam(
    template: ExamTemplate,
  ): Promise<Question[]> {
    const requiredCount =
      template.singleChoiceCount + template.multipleChoiceCount;
    let questions: Question[] = [];

    // 1. 首先从目标分类中获取题目
    if (template.targetCategoryIds?.length > 0) {
      questions = await this.questionRepo
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.options', 'options')
        .where('q.categoryId IN (:...categories)', {
          categories: template.targetCategoryIds,
        })
        .orderBy('RAND()')
        .limit(requiredCount * 2) // 多取一些以防有重复或无效题目
        .getMany();
    }

    // 2. 如果从目标分类获取的题目不足，从所有分类补充
    if (questions.length < requiredCount) {
      const remainingCount = requiredCount - questions.length;
      const fallbackQuestions = await this.questionRepo
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.options', 'options')
        .where(
          template.targetCategoryIds?.length > 0
            ? 'q.categoryId NOT IN (:...categories)'
            : '1=1',
          {
            categories: template.targetCategoryIds || [],
          },
        )
        .orderBy('RAND()')
        .limit(remainingCount)
        .getMany();

      questions = [...questions, ...fallbackQuestions];
    }

    // 3. 确保题目类型分布正确
    const singleChoiceQuestions = questions
      .filter((q) => q.questionType === 'single')
      .slice(0, template.singleChoiceCount);

    const multipleChoiceQuestions = questions
      .filter((q) => q.questionType === 'multiple')
      .slice(0, template.multipleChoiceCount);

    // 4. 如果某种题型不足，用另一种题型补充（可选）
    const finalQuestions = [
      ...singleChoiceQuestions,
      ...multipleChoiceQuestions,
    ];
    if (finalQuestions.length < requiredCount) {
      const remainingCount = requiredCount - finalQuestions.length;
      const additionalQuestions = await this.questionRepo
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.options', 'options')
        .where({ questionId: Not(In(finalQuestions.map((q) => q.questionId))) })
        .orderBy('RAND()')
        .limit(remainingCount)
        .getMany();

      finalQuestions.push(...additionalQuestions);
    }

    return finalQuestions.slice(0, requiredCount);
  }

  private async tryGenerateQuestions(
    categoryIds: number[],
    singleCount: number,
    multipleCount: number,
    excludedIds: number[] = [],
  ): Promise<Question[]> {
    if (!categoryIds.length) return [];

    const query = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .where('q.categoryId IN (:...categories)', { categories: categoryIds })
      .andWhere({ questionId: Not(In([...excludedIds, 0])) });

    const [single, multiple] = await Promise.all([
      query
        .clone()
        .andWhere('q.questionType = :type', { type: 'single' })
        .orderBy('RAND()')
        .limit(singleCount)
        .getMany(),
      query
        .clone()
        .andWhere('q.questionType = :type', { type: 'multiple' })
        .orderBy('RAND()')
        .limit(multipleCount)
        .getMany(),
    ]);

    return [...single, ...multiple];
  }

  private async getFallbackQuestions(
    excludeCategoryIds: number[],
    count: number,
    excludedQuestionIds: number[] = [],
  ): Promise<Question[]> {
    const query = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .where({ questionId: Not(In([...excludedQuestionIds, 0])) });

    if (excludeCategoryIds.length > 0) {
      query.andWhere('q.categoryId NOT IN (:...excludeCategories)', {
        excludeCategories: excludeCategoryIds,
      });
    }

    return query.orderBy('RAND()').limit(count).getMany();
  }

  private async getWrongCategories(userId: number): Promise<number[]> {
    const result = await this.userExamQuestionRepo
      .createQueryBuilder('ueq')
      .select('q.category_id', 'categoryId')
      .addSelect('COUNT(*)', 'errorCount')
      .innerJoin('ueq.question', 'q')
      .innerJoin('ueq.userExam', 'ue') // 添加与UserExam的关联
      .where('ue.userId = :userId', { userId }) // 使用ue.userId而不是ueq.userId
      .andWhere('ueq.isCorrect = false')
      .groupBy('q.category_id')
      .orderBy('errorCount', 'DESC')
      .limit(3)
      .getRawMany();

    return result.map((r) => r.categoryId as number);
  }

  private async getExcludedQuestionIds(userId: number): Promise<number[]> {
    const wrongQuestions = await this.userExamQuestionRepo.find({
      where: {
        userExam: { userId },
        isCorrect: false,
      },
      select: ['questionId'],
    });
    return [...new Set(wrongQuestions.map((q) => q.questionId))];
  }

  private getRequiredCount(template: ExamTemplate): number {
    return template.singleChoiceCount + template.multipleChoiceCount;
  }

  async getExamResult(userExamId: number) {
    // 1. 获取考试基本信息
    const userExam = await this.userExamRepo.findOne({
      where: { userExamId },
      relations: ['examTemplate', 'userExamQuestions'],
    });

    if (!userExam) {
      throw new NotFoundException('考试记录不存在');
    }

    if (userExam.status !== 'finished') {
      throw new BadRequestException('考试尚未完成，无法查看成绩');
    }

    // 2. 获取详细的答题情况
    const examQuestions = await this.userExamQuestionRepo.find({
      where: { userExamId },
      relations: ['question'],
    });

    // 3. 计算统计数据
    const correctCount = examQuestions.filter((q) => q.isCorrect).length;
    const wrongCount = examQuestions.length - correctCount;

    // 判断是否通过
    const passThreshold = userExam.examTemplate.totalScore * 0.6;
    const result = userExam.totalScore >= passThreshold ? '通过' : '未通过';

    // 4. 构建返回数据
    return {
      userExamId: userExam.userExamId,
      totalScore: userExam.examTemplate.totalScore,
      scoreObtained: userExam.totalScore,
      correctCount,
      wrongCount,
      examTime: userExam.createdAt.toISOString(),
      result,
      passStatus: result === '通过',
    };
  }
  async getUserExamRecords(userId: number) {
    // 1. 获取用户的所有考试记录
    const userExams = await this.userExamRepo.find({
      where: { userId },
      relations: ['examTemplate'],
      order: { createdAt: 'DESC' }, // 按创建时间倒序排列
    });

    // 2. 构建返回数据
    return {
      userId,
      records: userExams.map((exam) => ({
        userExamId: exam.userExamId,
        examName: exam.examTemplate.examName,
        examType: exam.examTemplate.examType,
        status: exam.status,
        score: exam.totalScore, // 已完成的考试有分数，未完成的为null
        time: exam.createdAt,
        duration: exam.examTemplate.duration,
        totalScore: exam.examTemplate.totalScore,
      })),
    };
  }
  async getWrongQuestions(userExamId: number) {
    // 1. 验证考试是否存在且已完成
    const userExam = await this.userExamRepo.findOne({
      where: { userExamId },
    });

    if (!userExam) {
      throw new NotFoundException('考试记录不存在');
    }

    if (userExam.status !== 'finished') {
      throw new BadRequestException('考试尚未完成，无法查看错题');
    }

    // 2. 获取所有错题
    const wrongQuestions = await this.userExamQuestionRepo.find({
      where: {
        userExamId,
        isCorrect: false,
      },
      relations: ['question', 'question.options'],
    });

    // 3. 构建返回数据
    return {
      userExamId,
      wrongQuestions: wrongQuestions.map((wq) => {
        const correctOptions = wq.question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.optionId);
        return {
          questionId: wq.question.questionId,
          content: wq.question.content,
          correctOptionIds: correctOptions,
          yourOptionIds: wq.selectedOptionIds,
          questionType: wq.question.questionType,
        };
      }),
    };
  }

  private mockQuestions = [
    {
      questionId: 4,
      questionType: 'single',
      content: '以下哪项是正确的佩戴安全帽方式？',
      options: [
        { optionId: 14, content: '帽子反戴' },
        { optionId: 15, content: '不系下巴带' },
        { optionId: 16, content: '系好下巴带，正确佩戴' },
        { optionId: 17, content: '戴在安全帽外层的帽子' },
      ],
    },
    {
      questionId: 8,
      questionType: 'multiple',
      content: '操作前需要检查哪些安全措施？',
      options: [
        { optionId: 34, content: '设备是否有故障' },
        { optionId: 35, content: '工友今天心情是否良好' },
        { optionId: 36, content: '工具是否完好' },
        { optionId: 37, content: '有无佩戴防护用品' },
      ],
    },
    {
      questionId: 12,
      questionType: 'single',
      content: '港口作业人员应该具备哪项技能？',
      options: [
        { optionId: 6, content: '游泳' },
        { optionId: 7, content: '掌握安全操作规程' },
        { optionId: 8, content: '跳远' },
        { optionId: 9, content: '高空飞行' },
      ],
    },
    {
      questionId: 7,
      questionType: 'multiple',
      content: '高处作业前应该做好哪些准备？',
      options: [
        { optionId: 10, content: '穿拖鞋' },
        { optionId: 11, content: '穿戴好安全带' },
        { optionId: 12, content: '设置安全警示' },
        { optionId: 13, content: '确认无高空坠物风险' },
      ],
    },
  ];

  async getExamDetail(userExamId: number) {
    // 1. 获取考试基本信息
    const userExam = await this.userExamRepo.findOne({
      where: { userExamId },
      relations: ['examTemplate'],
    });

    if (!userExam) {
      throw new NotFoundException('考试记录不存在');
    }

    // 2. 获取考试题目
    const examQuestions = await this.userExamQuestionRepo.find({
      where: { userExamId },
      relations: ['question', 'question.options'],
    });

    // 3. 构建返回数据结构
    return {
      userExamId: userExam.userExamId,
      examName: userExam.examTemplate.examName,
      examType: userExam.examTemplate.examType,
      duration: userExam.examTemplate.duration,
      status: userExam.status,
      createdAt: userExam.createdAt,
      questions: examQuestions.map((eq) => ({
        userExamQuestionId: eq.userExamQuestionId,
        questionId: eq.question.questionId,
        questionType: eq.question.questionType,
        content: eq.question.content,
        score: eq.question.score,
        selectedOptionIds: eq.selectedOptionIds, // 用户已选择的选项
        options: eq.question.options.map((option) => ({
          optionId: option.optionId,
          content: option.content,
        })),
      })),
    };
  }

  async submitExam(
    userExamId: number,
    answers: { questionId: number; selectedOptionIds: number[] }[],
  ) {
    const submittedAt = new Date();

    return this.dataSource.transaction(async (manager) => {
      // 1. 验证考试是否存在且未完成
      const userExam = await manager.findOne(UserExam, {
        where: { userExamId },
        relations: ['examTemplate'],
      });

      if (!userExam) {
        throw new NotFoundException('考试记录不存在');
      }

      if (userExam.status === 'finished') {
        throw new BadRequestException('考试已结束，不能重复提交');
      }

      // 2. 处理每道题的答案
      let totalScore = 0;
      const processedAnswers: {
        questionId: number;
        selectedOptionIds: number[];
      }[] = [];

      for (const answer of answers) {
        // 获取考试题目记录
        const examQuestion = await manager.findOne(UserExamQuestion, {
          where: { userExamId, questionId: answer.questionId },
          relations: ['question', 'question.options'],
        });

        if (!examQuestion) continue;

        // 记录接收到的答案
        processedAnswers.push({
          questionId: answer.questionId,
          selectedOptionIds: answer.selectedOptionIds,
        });

        // 更新用户选择的选项
        examQuestion.selectedOptionIds = answer.selectedOptionIds;

        // 阅卷逻辑
        const correctOptionIds = examQuestion.question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.optionId)
          .sort();

        const isCorrect = this.compareArrays(
          answer.selectedOptionIds.sort(),
          correctOptionIds,
        );

        examQuestion.isCorrect = isCorrect;
        examQuestion.score = isCorrect ? examQuestion.question.score : 0;
        totalScore += examQuestion.score;

        await manager.save(examQuestion);
      }

      // 3. 更新考试状态和总成绩
      userExam.status = 'finished';
      userExam.totalScore = totalScore;
      await manager.save(userExam);

      // 4. 返回提交结果
      return {
        message: '答卷提交成功',
        userExamId,
        receivedAnswers: processedAnswers,
        submittedAt,
        totalScore,
        passStatus: totalScore >= userExam.examTemplate.totalScore * 0.6,
      };
    });
  }

  // 辅助方法：比较两个数组是否相同
  private compareArrays(arr1: any[], arr2: any[]): boolean {
    return (
      arr1.length === arr2.length &&
      arr1.every((value, index) => value === arr2[index])
    );
  }
  mockStartExam(templateId: number) {
    console.log(templateId);
    return {
      userExamId: 3,
      duration: 30,
      questions: this.mockQuestions,
    };
  }

  // mock：获取某次考试详情
  mockGetExamDetail(userExamId: number) {
    return {
      userExamId,
      duration: 30,
      questions: this.mockQuestions,
    };
  }
  mockSubmitExam(userExamId: number, body: any) {
    return {
      message: '答卷提交成功',
      userExamId,
      receivedAnswers: body.answers || [],
      submittedAt: new Date().toISOString(),
    };
  }

  mockGetScore(userExamId: number) {
    return {
      userExamId,
      totalScore: 100,
      scoreObtained: 85,
      correctCount: 7,
      wrongCount: 1,
      examTime: '2025-04-14 14:00',
      durationUsed: 18,
      result: '通过',
    };
  }
  mockWrongAnalysis(userExamId: number) {
    return {
      userExamId,
      wrongQuestions: [
        {
          questionId: 2,
          content: '操作前需要检查哪些安全措施？',
          correctOptionIds: [201, 203, 204],
          yourOptionIds: [201, 204],
          explanation: '工具是否完好是安全检查重点，缺失此选项导致错误。',
        },
      ],
      totalWrong: 1,
    };
  }

  mockExamRecordList(userId: number) {
    return {
      userId,
      records: [
        {
          userExamId: 4,
          examName: '4月月考test',
          examType: 'normal',
          status: 'finished',
          score: 85,
          time: '2025-04-14 14:00',
        },
        {
          userExamId: 5,
          examName: '3月补考',
          examType: 'makeup',
          status: 'finished',
          score: 92,
          time: '2025-03-28 10:00',
        },
        {
          userExamId: 6,
          examName: 'test考试',
          examType: 'special',
          status: 'pending',
          score: null,
          time: '2025-04-20 09:00',
        },
      ],
    };
  }
}
