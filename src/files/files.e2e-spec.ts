import { HttpServer } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import supertest from 'supertest';
import { code, setupApplication, setupLoggedUser } from '../tests/utils';

describe('Files (E2E)', function () {
  let module: TestingModule, server: HttpServer;
  let accessToken: string;

  before('setup suite', async function () {
    ({ module, server } = await setupApplication());
    ({ accessToken } = await setupLoggedUser(server));
  });
  after(async function () {
    await module.close();
  });

  describe('uploading files', function () {
    it('fails if file is not provided', async function () {
      const response = await supertest(server)
        .post('/files/upload')
        .auth(accessToken, { type: 'bearer' })
        .expect(code(400));

      expect(response.body.message).to.match(/no file uploaded/i);
    });

    it('uploads file correctly', async function () {
      const response = await supertest(server)
        .post('/files/upload')
        .auth(accessToken, { type: 'bearer' })
        .attach('file', Buffer.from('ciaos'), { filename: 'File' })
        .expect(code(201));

      expect(response.body).to.haveOwnProperty('fileName');
    });
  });
});
