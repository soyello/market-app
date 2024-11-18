import { AdapterUser } from 'next-auth/adapters';

export interface User extends AdapterUser {
  id: string;
  name?: string | null;
  email: string;
  emailVerified: Date | null;
  hashedPassword?: string | null;
  // userType: 'User' | 'Admin';
  // createdAt: Date;
  // updatedAt: Date;
  favoriteIds?: string[]; // favoriteIds가 JSON 형식으로 저장되므로, 여기서는 string 배열로 해석합니다.
}
