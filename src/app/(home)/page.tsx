import Container from '@/components/Container';
import getProducts, { ProductsParams } from '../actions/getProducts';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/products/ProductCard';
import FloatingButton from '@/components/FloatingButton';
import getCurrentUser from '../actions/getCurrentUser';
import { Product } from '@/types/product';
import Categories from '@/components/categories/Categories';
import { PRODUCTS_PER_PAGE } from '@/constants';
import Pagination from '@/components/Pagination';

interface HomeProps {
  searchParams: ProductsParams;
}

export default async function Home({ searchParams }: HomeProps) {
  const pageNum = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  console.log('pageNum', pageNum);

  const currentUser = await getCurrentUser();

  // getProducts 호출 시 `NextResponse.json` 응답을 바로 활용
  const response = await getProducts(searchParams);
  const { products, totalItems } = await response.json();

  console.log('products', products);
  console.log('total items', totalItems);

  return (
    <Container>
      <Categories />
      {products?.length === 0 ? (
        <EmptyState showReset />
      ) : (
        <>
          <div className='grid grid-cols-1 gap-8 pt-12 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'>
            {products.map((product: Product) => (
              <ProductCard currentUser={currentUser} key={product.id} data={product} />
            ))}
          </div>
        </>
      )}

      <Pagination page={pageNum} totalItems={totalItems} perPage={PRODUCTS_PER_PAGE} />
      <FloatingButton href='/products/upload'>+</FloatingButton>
    </Container>
  );
}
