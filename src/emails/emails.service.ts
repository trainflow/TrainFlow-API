import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ForgotPasswordToken } from '../auth/forgot-password-token.entity';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  constructor(private readonly mailerService: MailerService) {}

  async sendForgotPasswordEmail(token: ForgotPasswordToken) {
    await this.mailerService.sendMail({
      to: token.user.email,
      text: token.token,
      subject: 'Password reset request for your account',
      template: 'password-reset',
      context: {
        token: token.token,
        resetLink: 'https://TODOaddresetlink.com/reset',
      },
    });
    // this.logger.error('Method not implemented: sendForgotPasswordEmail');
  }
}
