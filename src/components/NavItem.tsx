import React from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { User } from 'next-auth';

interface NavItemProps {
  mobile?: boolean;
  currentUser?: User | null;
}

const NavItem = ({ mobile, currentUser }: NavItemProps) => {
  return (
    <ul className={`text-md justify-center flex gap-4 w-full itmes-center ${mobile && 'flex-col h-full'}`}>
      <li className='py-2 text-center border-b-4 cursor-pointer'>
        <Link href='/admin'>Admin</Link>
      </li>
      <li className='py-2 text-center border-b-4 cursor-pointer'>
        <Link href='/user'>User</Link>
      </li>
      <li className='py-2 text-center border-b-4 cursor-pointer'>
        <Link href='/chat'>Chat</Link>
      </li>

      {currentUser ? (
        <li className='py-2 text-center border-b-4 cursor-pointer'>
          <button onClick={() => signOut()}>SignOut</button>
        </li>
      ) : (
        <li className='py-2 text-center border-b-4 cursor-pointer'>
          <button onClick={() => signIn()}>SignIn</button>
        </li>
      )}
    </ul>
  );
};

export default NavItem;
