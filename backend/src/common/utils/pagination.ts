export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

export function getPaginationParams(query: any): PaginationParams {
  return {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : 10,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: (query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
  };
}

export function getSkipTake(page: number = 1, limit: number = 10): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildOrderBy(sortBy: string, sortOrder: 'ASC' | 'DESC'): any {
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    return { [parts[0]]: { [parts.slice(1).join('.')]: sortOrder } };
  }
  return { [sortBy]: sortOrder };
}

export function buildWhereClause(filters: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string' && key !== 'id' && !key.endsWith('Id')) {
        where[key] = { $ilike: `%${value}%` };
      } else {
        where[key] = value;
      }
    }
  }
  return where;
}
