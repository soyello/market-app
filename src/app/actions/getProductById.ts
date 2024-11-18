import MySQLAdapter from '../lib/mysqlAdapter';

interface Params {
  productId?: string;
}

export default async function getProductById(params: Params) {
  try {
    const { productId } = params;
    if (!productId) return null;
    const product = await MySQLAdapter.getProductWithUser(productId);
    if (!product) return null;
    console.log('Fetched product:', product);

    return product;
  } catch (error: any) {
    throw new Error(error);
  }
}
