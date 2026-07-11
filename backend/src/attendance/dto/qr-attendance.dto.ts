import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QrAttendanceDto {
  @ApiProperty()
  @IsUUID()
  lectureId: string;

  @ApiProperty()
  @IsString()
  qrCode: string;
}
