// src/users/user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserExam } from './user-exam.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ length: 20 })
  role: string;

  @OneToMany(() => UserExam, (userExam) => userExam.user)
  userExams: UserExam[]; // 增加与 UserExam 的关联
}
