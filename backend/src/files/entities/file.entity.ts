import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ length: 500, nullable: true })
  url: string;

  @Column({ length: 500, nullable: true })
  key: string;

  @Column({ length: 100, default: 'local' })
  bucket: string;

  @Column()
  uploadedBy: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
