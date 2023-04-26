import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { expect } from 'chai';
import Sinon from 'sinon';
import { EmailsService } from '../emails/emails.service';
import { TestCache, createStubbedRepository } from '../tests/utils';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ForgotPasswordToken } from './forgot-password-token.entity';

describe('auth', function () {
  let authService: AuthService;
  let usersService: Sinon.SinonStubbedInstance<UsersService>;
  let cache: Sinon.SinonStubbedInstance<TestCache>;

  beforeEach(async function () {
    usersService = Sinon.createStubInstance(UsersService);
    cache = Sinon.createStubInstance(TestCache);

    authService = new AuthService(
      usersService,
      new JwtService({ secret: 'testPrivateKey' }),
      new ConfigService(),
      Sinon.createStubInstance(EmailsService),
      createStubbedRepository<ForgotPasswordToken>(),
      cache,
    );

    usersService.findOneByUsername.resolves(
      new User({ username: 'username', password: 'password', id: 1 }),
    );
  });

  describe('login', function () {
    it('returns a token pair', async function () {
      const user = await usersService.findOneByUsername('username');
      expect(user).not.to.be.undefined;
      if (!user) return;
      const result = await authService.login(user);
      expect(result).to.haveOwnProperty('accessToken');
      expect(result).to.haveOwnProperty('refreshToken');
    });
  });
});
