import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as mime from 'mime';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const extension = mime.getExtension(file.mimetype);

    const newFileName = await this.filesService.writeAnonymous(
      file.buffer,
      extension ?? undefined,
    );
    this.logger.verbose(
      `Uploaded new file: ${file.originalname} to ${newFileName}`,
    );
    return { fileName: newFileName };
  }

  @Get(':file')
  async getFile(
    @Res({ passthrough: true }) res: Response,
    @Param('file') fileName: string,
    @Query('width') widthString?: string,
  ): Promise<StreamableFile> {
    const mimeType = mime.getType(fileName);

    const setHeaders = () => {
      res.set({
        'Content-Type': mimeType ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
    };

    if (widthString != null) {
      const width = parseInt(widthString);
      if (isNaN(width)) {
        throw new BadRequestException('Width must be a positive integer');
      }

      if (!mimeType?.includes('image')) {
        throw new BadRequestException('Cannot resize a non-image file');
      }
      if (width <= 0) {
        throw new BadRequestException('Width must be a positive integer');
      }

      setHeaders();
      return new StreamableFile(
        await this.filesService.readResized(fileName, width),
      );
    }

    setHeaders();
    const stream = this.filesService.stream(fileName);
    return new StreamableFile(stream);
  }
}
