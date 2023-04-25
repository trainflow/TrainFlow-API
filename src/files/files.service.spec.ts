import { expect } from 'chai';
import * as fs from 'fs';
import sinon from 'sinon';
import { Repository } from 'typeorm';
import { createStubbedRepository, expectThrowsAsync } from '../tests/utils';
import { FilesService } from './files.service';
import { StoredFile } from './stored-file.entity';

describe('FilesService', function () {
  let service: FilesService;
  let storedFileRepository: sinon.SinonStubbedInstance<Repository<StoredFile>>;

  beforeEach(async function () {
    storedFileRepository = createStubbedRepository();

    service = new FilesService(storedFileRepository);
  });

  it('should be defined', function () {
    expect(service).to.not.be.undefined;
  });

  describe('reading files', function () {
    it('throws if the file requested does not exist', async function () {
      expectThrowsAsync(service.read('non-existent-path'));
    });

    describe('with an existing file', function () {
      const name = 'some-file.tmp';
      let filePath: string;
      before(async function () {
        filePath = service.resolveFileName(name);

        const fd = fs.openSync(filePath, 'w');
        fs.writeSync(fd, 'hello world');
        fs.closeSync(fd);
      });
      after(function () {
        fs.rmSync(filePath);
      });

      it('reads file correctly', async function () {
        const result = await service.read(name);
        expect(result.toString('utf-8')).to.eql('hello world');
      });
    });
  });

  describe('writing files', function () {
    const name = 'some-file.tmp';
    after(function () {
      const filePath = service.resolveFileName(name);

      fs.rmSync(filePath);
    });

    it('creates a file given a file name and a buffer', async function () {
      expect(await service.write(name, Buffer.from('I am a new file!'))).to.be
        .undefined;
    });

    it('creates an anonymous file given a buffer', async function () {
      expect(await service.writeAnonymous(Buffer.from('I am a new file!'))).to
        .be.a.string;
    });

    it('creates an anonymous file given a buffer and extension', async function () {
      expect(await service.writeAnonymous(Buffer.from('I am a new file!'))).to
        .be.a.string;
    });
  });
});
