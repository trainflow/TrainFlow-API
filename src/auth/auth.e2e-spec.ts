import { HttpServer } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import { User } from 'src/users/user.entity';
import { UserDTO } from 'src/users/users.controller';
import request from 'supertest';
import { code, setupApplication } from '../tests/utils';

describe('AuthController (E2E)', function () {
  let module: TestingModule;
  let server: HttpServer;

  const userDTO: UserDTO = {
    password: 'TestPassword123@',
    username: 'testusername',
    email: 'testemail@email.com',
  };

  let userId: number;

  before(async function () {
    ({ server, module } = await setupApplication());
    const response = await request(server)
      .post('/users')
      .send(userDTO)
      .expect(code(200));
    userId = response.body.id;
  });

  // Delete user
  after(async function () {
    const response = await request(server)
      .post('/auth/login')
      .send(userDTO)
      .expect(code(200));

    const { accessToken } = response.body;
    await request(server)
      .delete(`/users/${userId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(code(204));

    await module.close();
  });

  describe('User login behavior', function () {
    it('logins', async function () {
      const response = await request(server)
        .post('/auth/login')
        .send(userDTO)
        .expect(200);

      expect(response.body).to.haveOwnProperty('accessToken');
      expect(response.body).to.haveOwnProperty('refreshToken');
    });

    it('does not login if credentials are wrong', async function () {
      await request(server)
        .post('/auth/login')
        .send({ ...userDTO, password: 'wrongpassword' })
        .expect(401);

      await request(server)
        .post('/auth/login')
        .send({ ...userDTO, username: 'wrongusername' })
        .expect(401);
    });
  });

  describe('/me endpoint', function () {
    let accessToken: string;

    // Login
    beforeEach(async function () {
      const response = await request(server)
        .post('/auth/login')
        .send(userDTO)
        .expect(code(200));

      ({ accessToken } = response.body);
    });

    it('returns unauthorized if no auth token is provided', async function () {
      await request(server).get('/auth/me').expect(401);
    });

    it('returns data if auth token is provided', async function () {
      const response = await request(server)
        .get('/auth/me')
        .auth(accessToken, { type: 'bearer' })
        .expect(code(200));

      const { body } = response;
      expect(body).not.to.haveOwnProperty(<keyof User>'password');
      expect(body).to.haveOwnProperty(<keyof User>'id');
      expect(body).to.haveOwnProperty(<keyof User>'isActive');
      expect(body).to.haveOwnProperty(<keyof User>'username');
    });
  });
});
