import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RagDocument } from './document.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly embeddingDimension = 1536;

  constructor(
    @InjectRepository(RagDocument)
    private readonly ragDocRepo: Repository<RagDocument>,
  ) {}

  async ingestDocument(
    filePath: string,
    source: string,
    language: string,
    chunkSize = 500,
  ): Promise<number> {
    try {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const chunks = this.chunkText(content, chunkSize);
      let count = 0;

      for (let i = 0; i < chunks.length; i++) {
        const existing = await this.ragDocRepo.findOne({
          where: { source, chunkIndex: i },
        });

        if (!existing || existing.content !== chunks[i]) {
          const embedding = await this.generateEmbedding(chunks[i]);
          const doc = this.ragDocRepo.create({
            content: chunks[i],
            source,
            language,
            chunkIndex: i,
            title: path.basename(filePath, path.extname(filePath)),
            embedding,
            metadata: { source, chunkIndex: i, language },
          });
          await this.ragDocRepo.save(doc);
          count++;
        }
      }

      this.logger.log(`Ingested ${count} chunks from ${source}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to ingest document ${source}: ${error.message}`);
      throw error;
    }
  }

  async similaritySearch(
    query: string,
    language: string,
    topK = 5,
  ): Promise<{ content: string; source: string; score: number }[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const docs = await this.ragDocRepo.find({
      where: { language },
      order: { createdAt: 'DESC' },
    });

    const scored = docs
      .map((doc) => ({
        content: doc.content,
        source: doc.source,
        title: doc.title,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding || []),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.filter((s) => s.score > 0.5);
  }

  async getContextForQuery(
    query: string,
    language: string,
  ): Promise<{ context: string; sources: string[] }> {
    const results = await this.similaritySearch(query, language, 5);
    const context = results.map((r) => `[${r.source}]: ${r.content}`).join('\n\n');
    const sources = [...new Set(results.map((r) => r.source))];
    return { context, sources };
  }

  async ingestAllDocuments(): Promise<void> {
    const docsDir = path.join(__dirname, 'documents');
    if (!fs.existsSync(docsDir)) {
      this.logger.warn('Documents directory not found');
      return;
    }

    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const lang = file.endsWith('-ar.md') ? 'ar' : 'en';
      const source = file.replace(/\.md$/, '');
      await this.ingestDocument(path.join(docsDir, file), source, lang);
    }
    this.logger.log(`Ingested ${files.length} documents`);
  }

  async clearDocuments(): Promise<void> {
    await this.ragDocRepo.clear();
    this.logger.log('Cleared all RAG documents');
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const embedding: number[] = [];

    for (let i = 0; i < this.embeddingDimension; i++) {
      let val = 0;
      for (let j = 0; j < words.length; j++) {
        val += (words[j].charCodeAt(0) || 0) * Math.sin((i + 1) * (j + 1));
      }
      embedding.push(Math.tanh(val / words.length || 1));
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return magnitude > 0 ? embedding.map((v) => v / magnitude) : embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
