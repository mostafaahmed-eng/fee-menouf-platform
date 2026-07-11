import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Smart search across students, courses, and doctors' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: ['students', 'courses', 'doctors', 'all'] })
  async search(
    @Query('q') q: string,
    @Query('type') type?: 'students' | 'courses' | 'doctors' | 'all',
  ) {
    return this.searchService.search(q, type);
  }

  @Get('advanced')
  @ApiOperation({ summary: 'Advanced search with filters' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'minCredits', required: false })
  @ApiQuery({ name: 'maxCredits', required: false })
  @ApiQuery({ name: 'type', required: false })
  async advancedSearch(
    @Query('query') query?: string,
    @Query('departmentId') departmentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('level') level?: number,
    @Query('minCredits') minCredits?: number,
    @Query('maxCredits') maxCredits?: number,
    @Query('type') type?: string,
  ) {
    return this.searchService.advancedSearch({
      query,
      departmentId,
      academicYear,
      level: level ? Number(level) : undefined,
      minCredits: minCredits ? Number(minCredits) : undefined,
      maxCredits: maxCredits ? Number(maxCredits) : undefined,
      type,
    });
  }
}
