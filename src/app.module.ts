import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionModule } from './question/question.module';
import { TemplateModule } from './template/template.module';
import { UserExamModule } from './user-exam/user-exam.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql', // 或 postgres
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'examplatform',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // 自动加载 entity
      synchronize: true, // 开发阶段可以为 true，会自动建表
    }),
    UserModule,
    QuestionModule,
    TemplateModule,
    UserExamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
