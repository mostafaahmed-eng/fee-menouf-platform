import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileEntity } from './entities/file.entity';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadedBy: string,
    description?: string,
  ): Promise<FileEntity> {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    fs.writeFileSync(filePath, file.buffer);

    const fileEntity = this.fileRepo.create({
      filename: uniqueName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${uniqueName}`,
      key: uniqueName,
      bucket: 'local',
      uploadedBy,
      description: description || '',
      isProcessed: true,
    });

    return this.fileRepo.save(fileEntity);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadedBy: string,
  ): Promise<FileEntity[]> {
    const uploaded: FileEntity[] = [];
    for (const file of files) {
      const result = await this.uploadFile(file, uploadedBy);
      uploaded.push(result);
    }
    return uploaded;
  }

  async getFile(id: string): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async getFilePath(id: string): Promise<string> {
    const file = await this.getFile(id);
    return path.join(this.uploadDir, file.filename);
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id);
    const filePath = path.join(this.uploadDir, file.filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.warn(`Could not delete physical file ${file.filename}: ${error.message}`);
    }

    await this.fileRepo.remove(file);
  }

  async uploadToS3(
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<FileEntity> {
    const endpoint = process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET || 'fee-menouf';
    const region = process.env.S3_REGION || 'us-east-1';

    if (!endpoint) {
      return this.uploadFile(file, uploadedBy);
    }

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || process.env.MINIO_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });

    const key = `${uuidv4()}-${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const fileEntity = this.fileRepo.create({
      filename: key,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${endpoint}/${bucket}/${key}`,
      key,
      bucket,
      uploadedBy,
      isProcessed: true,
    });

    return this.fileRepo.save(fileEntity);
  }
}
