import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionModule } from './question/question.module';
import { TemplateModule } from './template/template.module';
import { UserExamModule } from './user-exam/user-exam.module';
import { ConfigModule } from '@nestjs/config';
import * as process from 'node:process';
import { JwtStrategy } from './common/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'examplatform',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], //加载 entity
      synchronize: true,
    }),
    UserModule,
    QuestionModule,
    TemplateModule,
    UserExamModule,
  ],
  controllers: [],
  providers: [JwtStrategy],
})
export class AppModule {}
