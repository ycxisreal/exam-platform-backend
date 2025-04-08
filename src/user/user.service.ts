import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
// todo
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
  async login(username: string, password: string, role: string) {
    const user = await this.userRepo.findOne({
      where: { username, role },
    });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('密码错误');

    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
      userInfo: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
  async register(username: string, password: string, fullName: string) {
    const exist = await this.userRepo.findOne({ where: { username } });
    if (exist) {
      throw new UnauthorizedException('用户名已存在');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      username,
      passwordHash,
      fullName,
      role: 'user',
    });
    const saved = await this.userRepo.save(user);
    return {
      userInfo: {
        userId: saved.userId,
        username: saved.username,
        fullName: saved.fullName,
        role: saved.role,
      },
    };
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('原密码错误');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: '密码修改成功' };
  }
  async deleteAccount(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('用户不存在');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('密码错误');
    await this.userRepo.remove(user);
    return { message: '账户已注销' };
  }
}
