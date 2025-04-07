// src/questions/question-category.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './question.entity';
import { UserExamQuestion } from './user-exam-question.entity';

@Entity('question_categories')
export class QuestionCategory {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'category_name', length: 100, unique: true })
  categoryName: string;

  @OneToMany(() => Question, (question) => question.category)
  questions: Question[];

  @OneToMany(
    () => UserExamQuestion,
    (userExamQuestion) => userExamQuestion.question,
  )
  userExamQuestions: UserExamQuestion[]; // 增加与 UserExamQuestion 的关联
}
