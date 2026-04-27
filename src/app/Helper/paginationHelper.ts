export type IOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
};

export type IOptionResult = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  skip: number;
  take: number;
  status?: string;
};

const calculatePagination = (options: IOptions): IOptionResult => {
  const page: number = Number(options.page) || 1;
  const limit: number = Number(options.limit) || 10;
  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string = options.sortOrder || "desc";
  const skip: number = (Number(page) - 1) * limit;
  const take: number = limit;
  const status: string | undefined = options.status;
  return {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
    take,
    status,
  };
};
export const paginationHelper = {
  calculatePagination,
};
