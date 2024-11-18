import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import pool from '../../../lib/db';
import { NextAuthOptions, User } from 'next-auth';
import { RowDataPacket } from 'mysql2';
import NextAuth from 'next-auth/next';
import MySQLAdapter from '@/app/lib/mysqlAdapter';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MySQLAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'ID를 입력하세요' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // DB에서 사용자 찾기
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT id, name, email, hashed_password, userType FROM users WHERE email = ?',
          [credentials.email]
        );

        const user = rows[0];

        // 사용자 유효성 검사
        if (!user || !user.hashed_password) {
          throw new Error('Invalid credentials');
        }

        // 비밀번호 확인
        const isCorrectPassword = await bcrypt.compare(credentials.password, user.hashed_password);
        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        // 사용자 및 비밀번호 확인
        if (user && isCorrectPassword) {
          return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.userType as string,
          } as User;
        } else {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
