import getCurrentUser from '@/app/actions/getCurrentUser';
import MySQLAdapter from '@/app/lib/mysqlAdapter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, imageSrc, category, latitude, longitude, price } = body;

  if (!title || !description || !category || latitude === undefined || longitude === undefined || price === undefined) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  try {
    const product = await MySQLAdapter.createProduct({
      title,
      description,
      imageSrc,
      category,
      latitude,
      longitude,
      userId: currentUser.id,
      price: Number(price),
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
