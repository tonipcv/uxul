export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  userId: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  category?: string;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  isActive?: boolean;
} 