import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rag_documents')
export class RagDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'vector', array: true, nullable: true })
  embedding: number[];

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ length: 100 })
  source: string;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ type: 'int', default: 0 })
  chunkIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
