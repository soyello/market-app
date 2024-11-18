'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import Input from '@/components/Intput';
import Button from '@/components/Button';
import Link from 'next/link';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (body) => {
    setIsLoading(true);
    try {
      const data = signIn('credentials', body);
      console.log(data);
      router.push('/auth/login');
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section className='grid h-[calc(100vh_-_56px)] place-items-center'>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col justify-center gap-4 min-w-[350px]'>
        <h1 className='text-2xl'>Login</h1>
        <Input id='email' label='Email' disabled={isLoading} register={register} errors={errors} required />
        <Input id='password' label='Password' disabled={isLoading} register={register} errors={errors} required />
        <Button label='Login' />
        <div className='text-center'>
          <p className='text-gray-400'>
            Not a member?{' '}
            <Link href='/auth/register' className='text-black hover:underline'>
              Register
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
};

export default LoginPage;
