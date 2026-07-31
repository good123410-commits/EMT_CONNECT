export type HomeBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type HomeCommerceItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  partnerUrl: string;
  partnerLabel: string;
  isActive: boolean;
  sortOrder: number;
};

export type HomeDashboardConfig = {
  commerceItems: HomeCommerceItem[];
  updatedAt: string;
};
