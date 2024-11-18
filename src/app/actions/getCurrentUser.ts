import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import MySQLAdapter from '../lib/mysqlAdapter';

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return null;
    }
    const currentUser = await MySQLAdapter.getUserByEmail(session.user.email);

    if (!currentUser) {
      return null;
    }
    return currentUser;
  } catch (error) {
    return null;
  }
}
