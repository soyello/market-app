import { User } from '@/types/user';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { toast } from 'react-toastify';

interface UserFavorite {
  productId: string;
  currentUser?: User | null;
}

const useFavorite = ({ productId, currentUser }: UserFavorite) => {
  const router = useRouter();
  const hasFavorite = useMemo(() => {
    const list = currentUser?.favoriteIds || [];

    return list.includes(productId);
  }, [currentUser, productId]);

  const toggleFavorite = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.warn('먼저 로그인을 해주세요');
      return;
    }
    try {
      let request;
      if (hasFavorite) {
        request = () => axios.delete(`/api/favorites/${productId}`);
      } else {
        request = () => axios.post(`/api/favorites/${productId}`);
      }

      await request();
      router.refresh();
      toast.success('성공했습니다.');
    } catch (err) {
      toast.error('실패했습니다.');
    }
  };
  return { hasFavorite, toggleFavorite };
};

export default useFavorite;
