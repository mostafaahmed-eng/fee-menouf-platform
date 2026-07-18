import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../database/entities/system-setting.entity';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  academicYear: '2025-2026',
  currentSemester: '1',
  registrationOpen: true,
  gradePublishingEnabled: true,
  maxCreditsPerSemester: 18,
  attendanceThreshold: 75,
  aiAssistantEnabled: true,
  notificationEmail: true,
  notificationSms: false,
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
  ) {}

  async get(): Promise<Record<string, unknown>> {
    const row = await this.settingsRepository.findOne({ where: {} });
    if (!row) {
      const created = this.settingsRepository.create({ settings: DEFAULT_SETTINGS });
      const saved = await this.settingsRepository.save(created);
      return saved.settings;
    }
    return row.settings;
  }

  async update(partial: Record<string, unknown>): Promise<Record<string, unknown>> {
    let row = await this.settingsRepository.findOne({ where: {} });
    if (!row) {
      row = this.settingsRepository.create({ settings: { ...DEFAULT_SETTINGS, ...partial } });
    } else {
      row.settings = { ...row.settings, ...partial };
    }
    const saved = await this.settingsRepository.save(row);
    this.logger.log('System settings updated');
    return saved.settings;
  }
}
