import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserExam } from './user-exam.entity';
@Entity('exam_templates')
export class ExamTemplate {
  @PrimaryGeneratedColumn({ name: 'template_id' })
  templateId: number;
  @Column({ name: 'exam_name', length: 100 })
  examName: string;
  @Column({ name: 'exam_type', type: 'enum', enum: ['normal', 'makeup'] })
  examType: 'normal' | 'makeup';
  @Column()
  duration: number;
  @Column({ name: 'total_score' })
  totalScore: number;
  @Column({ name: 'single_choice_count' })
  singleChoiceCount: number;
  @Column({ name: 'multiple_choice_count' })
  multipleChoiceCount: number;
  @Column({ name: 'available_start', type: 'datetime' })
  availableStart: Date;
  @Column({ name: 'available_end', type: 'datetime' })
  availableEnd: Date;
  @OneToMany(() => UserExam, (userExam) => userExam.examTemplate)
  userExams: UserExam[];
}
