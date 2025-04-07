import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ExamTemplate } from './exam-template.entity';
import { UserExamQuestion } from './user-exam-question.entity';
@Entity('user_exams')
export class UserExam {
  @PrimaryGeneratedColumn({ name: 'user_exam_id' })
  userExamId: number;
  @Column({ name: 'user_id' })
  userId: number;
  @Column({ name: 'template_id' })
  templateId: number;
  @Column({ name: 'total_score', nullable: true })
  totalScore: number;
  @Column({ type: 'enum', enum: ['pending', 'finished'], default: 'pending' })
  status: 'pending' | 'finished';
  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  @ManyToOne(() => User, (user) => user.userExams)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @ManyToOne(() => ExamTemplate, (template) => template.userExams)
  @JoinColumn({ name: 'template_id' })
  examTemplate: ExamTemplate;
  @OneToMany(
    () => UserExamQuestion,
    (userExamQuestion) => userExamQuestion.userExam,
  )
  userExamQuestions: UserExamQuestion[];
}
