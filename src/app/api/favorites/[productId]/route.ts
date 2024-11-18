import getCurrentUser from '@/app/actions/getCurrentUser';
import MySQLAdapter from '@/app/lib/mysqlAdapter';
import { NextResponse } from 'next/server';

interface Params {
  productId?: string;
}

export async function POST(request: Request, context: { params: Params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  // params 자체를 비동기적으로 처리
  const productId = (await context.params).productId;

  if (!productId || typeof productId !== 'string') {
    throw new Error(`Invalid Id`);
  }

  let favoriteIds = [...(currentUser.favoriteIds || [])];
  favoriteIds.push(productId);

  const user = await MySQLAdapter.updateUser({
    id: currentUser.id,
    favoriteIds,
    email: currentUser.email,
  });

  return NextResponse.json(user);
}

export async function DELETE(request: Request, constext: { params: Params }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.error();
  }

  const productId = (await constext.params).productId;

  if (!productId || typeof productId !== 'string') {
    throw new Error(`Invalid Id`);
  }

  let favoriteIds = [...(currentUser.favoriteIds || [])];
  favoriteIds = favoriteIds.filter((id) => id !== productId);

  const user = await MySQLAdapter.updateUser({
    id: currentUser.id,
    favoriteIds,
    email: currentUser.email,
  });

  return NextResponse.json(user);
}
