// src/questions/question-option.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn({ name: 'option_id' })
  optionId: number;

  @Column({ name: 'question_id' })
  questionId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @ManyToOne(() => Question, (question) => question.options)
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
