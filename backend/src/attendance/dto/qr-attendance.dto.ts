import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QrAttendanceDto {
  @ApiProperty({ required: false })
  @IsUUID()
  lectureId: string;

  @ApiProperty({ description: 'HMAC-signed QR payload encoded as base64url' })
  @IsString()
  qrCode: string;
}
