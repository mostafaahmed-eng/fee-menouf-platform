import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';

export enum ConversationRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export enum ConversationLanguage {
  AR = 'AR',
  EN = 'EN',
}

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'session_id' })
  sessionId: string;

  @Column({ type: 'enum', enum: ConversationRole })
  role: ConversationRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ConversationLanguage, default: ConversationLanguage.EN })
  language: ConversationLanguage;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @Column({ type: 'int', default: 0, name: 'tokens_used' })
  tokensUsed: number;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => User, (user) => user.conversations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
