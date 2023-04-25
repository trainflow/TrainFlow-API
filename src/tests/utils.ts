import { Cache, Store } from 'cache-manager';
import { expect } from 'chai';
import Sinon from 'sinon';
import { ObjectLiteral, Repository } from 'typeorm';

import { HttpServer, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { STATUS_CODES } from 'http';
import supertest from 'supertest';
import AppModule from '../app.module';
import { TypeOrmExceptionFilter } from '../filters/typeorm.filter';
import { UserDTO } from '../users/users.controller';

export async function expectThrowsAsync(
  actual: Promise<any>,
  expected?: string | RegExp,
  message?: string,
): Promise<void>;

export async function expectThrowsAsync(
  actual: Promise<any>,
  constructor: Error | (() => any),
  expected?: string | RegExp,
  message?: string,
): Promise<void>;

export async function expectThrowsAsync(
  promise: Promise<any>,
  ...args: any[]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let synchronous = () => {};
  try {
    await promise;
  } catch (e) {
    synchronous = () => {
      throw e;
    };
  } finally {
    expect(synchronous).throw(...args);
  }
}

export async function setupLoggedUser(
  server: HttpServer,
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const userDTO: UserDTO = {
    password: 'testpassword',
    username: 'testusername',
    email: 'testemail@email.com',
  };

  let response = await supertest(server).post('/users').send(userDTO);

  const userId = response.body.id;
  response = await supertest(server)
    .post('/auth/login')
    .send(userDTO)
    .expect(code(200));
  const { accessToken, refreshToken } = response.body;

  return { accessToken, refreshToken, userId };
}

export function createStubbedRepository<
  T extends ObjectLiteral,
>(): Sinon.SinonStubbedInstance<Repository<T>> {
  return Sinon.createStubInstance(Repository<T>) as Sinon.SinonStubbedInstance<
    Repository<T>
  >;
}

export interface E2ETestSuite {
  app: INestApplication;
  module: TestingModule;
  server: HttpServer;
}

export async function setupApplication(): Promise<E2ETestSuite> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  const server = app.getHttpServer();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new TypeOrmExceptionFilter());

  await app.init();
  return { app, server, module };
}

export class TestCache implements Cache {
  async set() {
    return;
  }

  async get<T>() {
    return <T>{};
  }

  async del() {
    return;
  }

  async reset() {
    return;
  }
  async wrap<T>() {
    return <T>{};
  }
  store: Store;
}

/**
 * Helper function for supertest client expect assertion which will report a more helpful error message
 * instead of only reporting: Error: expected 204 "No Content", got 422 "Unprocessable Entity"
 */
export function code(statusCode: number, detailMsg?: string) {
  return (
    res: supertest.Response & { req: supertest.Request & { path: string } },
  ) => {
    if (res.status !== statusCode) {
      const description = res.req.method + ' ' + res.req.path;
      const statusName = STATUS_CODES[res.status];
      detailMsg = detailMsg ? detailMsg + `\n` : '';
      let text = res.text;
      try {
        text = JSON.stringify(res.body, undefined, 2);
        // eslint-disable-next-line no-empty
      } catch {}
      return new Error(
        `${detailMsg}${description} expected ${statusCode}, got ${res.status} "${statusName}" with message:\n${text}`,
      );
    }
  };
}
