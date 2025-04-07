import { Body, Controller, Delete, Post } from '@nestjs/common';
import { UserService } from './user.service';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('login')
  login(@Body() body: { username: string; password: string; role: string }) {
    return this.userService.login(body.username, body.password, body.role);
  }
  @Post('register')
  register(
    @Body() body: { username: string; password: string; fullName: string },
  ) {
    console.log(body);
    return this.userService.register(
      body.username,
      body.password,
      body.fullName,
    );
  }
  @Post('change-password')
  changePassword(
    @Body()
    body: {
      username: string;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.userService.changePassword(
      body.username,
      body.currentPassword,
      body.newPassword,
    );
  }
  @Delete('delete-account')
  deleteAccount(@Body() body: { username: string; password: string }) {
    return this.userService.deleteAccount(body.username, body.password);
  }
}
