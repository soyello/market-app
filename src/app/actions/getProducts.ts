import { NextResponse } from 'next/server';
import MySQLAdapter from '../lib/mysqlAdapter';
import { PRODUCTS_PER_PAGE } from '@/constants';

export interface ProductsParams {
  latitude?: number;
  longitude?: number;
  category?: string;
  page?: number;
  skip?: number;
}

export default async function getProducts(params: ProductsParams) {
  try {
    const { latitude, longitude, category, skip } = params;
    let query: any = {};
    if (category) {
      query.category = category;
    }

    if (latitude) {
      query.latitude = {
        min: Number(latitude) - 0.01,
        max: Number(latitude) + 0.01,
      };
    }
    if (longitude) {
      query.longitude = {
        min: Number(longitude) - 0.01,
        max: Number(longitude) + 0.01,
      };
    }
    try {
      const totalItems = await MySQLAdapter.getTotalProductCount(query);
      const products = await MySQLAdapter.getProducts(query, skip, PRODUCTS_PER_PAGE);

      return NextResponse.json({ products, totalItems });
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.error();
    }
  } catch (error: any) {
    throw new Error(error);
  }
}
