import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';

describe('EmailsService', function () {
  let service: EmailsService;

  beforeEach(async function () {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsService],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
  });

  it('should be defined', function () {
    expect(service).toBeDefined();
  });
});
