export interface Product {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  category: string;
  userId: string;
  price: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt?: Date;
}
