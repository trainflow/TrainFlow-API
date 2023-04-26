import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReadStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { readFile, readdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import sharp from 'sharp';
import { tmpdir } from 'tmp';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';
import { StoredFile } from './stored-file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(StoredFile)
    private storedFileRepository: Repository<StoredFile>,
  ) {
    this.ensureFileFolder();
  }

  resolveFileName(fileName: string) {
    return resolve(join('assets', fileName));
  }

  exists(fileName: string): boolean {
    const resolved = this.resolveFileName(fileName);
    return existsSync(resolved);
  }

  /**
   * Resizes the image contained in fileName with the necessary width and caches it in a tmp folder
   * @param fileName the file to read
   * @param width the final width
   * @returns a resized buffer
   */
  async readResized(fileName: string, width?: number): Promise<Buffer> {
    const cachedFileName = `tmp-${width}-${fileName}`;
    const filePath = join(tmpdir, cachedFileName);
    if (existsSync(filePath)) {
      return readFile(filePath);
    }

    const file = await this.read(fileName);
    const resized = await sharp(file)
      .resize({ width, withoutEnlargement: true })
      .toBuffer();
    writeFile(filePath, resized, 'binary');
    return resized;
  }

  /**
   * Reads a file from the filePath
   * @param filePath the path to read from
   * @throws if the file does not exist or is not readable
   */
  async read(filePath: string): Promise<Buffer> {
    return readFile(this.resolveFileName(filePath));
  }

  /**
   * Streams a file
   * @param fileName the name of the file to read
   * @throws if the file does not exist or is not readable
   * @returns a readable stream
   */
  stream(fileName: string): ReadStream {
    const file = createReadStream(this.resolveFileName(fileName));
    return file;
  }

  /**
   * Writes a file to a random filePath
   * @param contents file contents
   * @param extension an optional file extension
   * @returns the new file path
   */
  async writeAnonymous(contents: Buffer, extension?: string) {
    let fileName = `${uuid.v4()}`;
    if (extension != null) {
      fileName += `.${extension}`;
    }
    await this.write(fileName, contents);
    return fileName;
  }

  /**
   * Writes a file to the filePath
   * @param filePath the path to write to
   * @param contents file contents
   */
  async write(fileName: string, contents: Buffer) {
    await this.storedFileRepository.insert(
      new StoredFile({
        name: fileName,
        uploadedAt: new Date(),
      }),
    );
    fileName = this.resolveFileName(fileName);
    this.cleanOrphans();

    return writeFile(fileName, contents, { encoding: 'binary' });
  }

  /**
   * This method ensures that the assets folder exists.
   */
  private ensureFileFolder() {
    const folder = resolve('assets');
    const exists = existsSync(folder);
    if (!exists) {
      this.logger.verbose('Creating asset folder');
      mkdirSync(folder);
    }
  }

  /**
   * Removes orphaned files from the assets folder.
   *
   * A file is considered orphaned if it is not referenced in the database.
   */
  private async cleanOrphans() {
    const files = await readdir('assets');
    const storedFiles = await this.storedFileRepository.find();
    if (!storedFiles) {
      return;
    }
    const difference = files.filter(
      (file) => !storedFiles.find((storedFile) => file === storedFile.name),
    );
    for (const file of difference) {
      this.logger.verbose(`Removing orphaned file ${file}`);
      await unlink(this.resolveFileName(file));
    }
  }

  private readonly logger = new Logger(FilesService.name);
}
