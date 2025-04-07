import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserExam } from './user-exam.entity';
import { Question } from './question.entity';
import { QuestionCategory } from './question-category.entity';
@Entity('user_exam_questions')
export class UserExamQuestion {
  @PrimaryGeneratedColumn({ name: 'user_exam_question_id' })
  userExamQuestionId: number;
  @Column({ name: 'user_exam_id' })
  userExamId: number;
  @Column({ name: 'question_id' })
  questionId: number;
  @Column({ name: 'category_id' })
  categoryId: number;
  @Column({ type: 'json' })
  selectedOptionIds: number[];
  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;
  @Column()
  score: number;
  @ManyToOne(() => UserExam, (userExam) => userExam.userExamQuestions)
  @JoinColumn({ name: 'user_exam_id' })
  userExam: UserExam;
  @ManyToOne(() => Question, (question) => question.userExamQuestions)
  @JoinColumn({ name: 'question_id' })
  question: Question;
  @ManyToOne(() => QuestionCategory, (category) => category.userExamQuestions)
  @JoinColumn({ name: 'category_id' })
  category: QuestionCategory;
}
