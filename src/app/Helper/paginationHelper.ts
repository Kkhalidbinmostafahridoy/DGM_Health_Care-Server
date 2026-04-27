type IOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
};

const calculatePagination = (options: IOptions) => {
  const page: number = Number(options.page) || 1;
  const limit: number = Number(options.limit) || 10;
  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string = options.sortOrder || "desc";
  const skip: number = (Number(page) - 1) * limit;
  const take: number = limit;
  return {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
    take,
  };
};
export const paginationHelper = {
  calculatePagination,
};
