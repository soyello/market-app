import { User } from './user';

export type Message = {
  id: string; // 메시지 ID
  text?: string | null; // 메시지 내용 (null 허용)
  image?: string | null; // 첨부된 이미지 URL (null 허용)
  sender: User; // 보낸 사람 객체
  receiver: User; // 받는 사람 객체
  conversationId: string; // 대화 ID (외래 키)
  createdAt: Date; // 메시지 생성 시간
  updatedAt?: Date; // 메시지 수정 시간
};
