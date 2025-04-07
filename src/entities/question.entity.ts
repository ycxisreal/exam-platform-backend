import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { QuestionCategory } from './question-category.entity';
import { QuestionOption } from './question-option.entity';
import { UserExamQuestion } from './user-exam-question.entity';
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn({ name: 'question_id' })
  questionId: number;
  @Column({ name: 'question_type', type: 'enum', enum: ['single', 'multiple'] })
  questionType: 'single' | 'multiple';
  @Column({ type: 'text' })
  content: string;
  @Column()
  score: number;
  @Column({ name: 'category_id' })
  categoryId: number;
  @ManyToOne(() => QuestionCategory, (category) => category.questions, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: QuestionCategory;
  @OneToMany(() => QuestionOption, (option) => option.question)
  options: QuestionOption[];
  @OneToMany(
    () => UserExamQuestion,
    (userExamQuestion) => userExamQuestion.question,
  )
  userExamQuestions: UserExamQuestion[];
}
