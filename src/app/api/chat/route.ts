import getCurrentUser from '@/app/actions/getCurrentUser';
import pool from '@/app/lib/db';
import MySQLAdapter from '@/app/lib/mysqlAdapter';
import { ResultSetHeader } from 'mysql2';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersWithConversations = await MySQLAdapter.getUsersWithConversations();
    console.log(usersWithConversations);
    return NextResponse.json(usersWithConversations);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const body = await request.json();

  const { text, image, senderId, receiverId } = body;

  console.log('Text:', text);
  console.log('Image:', image);
  console.log('Sender ID:', senderId);
  console.log('Receiver ID:', receiverId);

  const conversation = await MySQLAdapter.getConversationByUsers(senderId, receiverId);

  console.log('Existing Conversation:', conversation);

  if (conversation) {
    try {
      const messageSql = `
        INSERT INTO messages (text, image, sender_id, receiver_id, conversation_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await pool.query<ResultSetHeader>(messageSql, [
        text,
        image,
        senderId,
        receiverId,
        conversation.id,
      ]);

      console.log('Message Insert Result:', result);

      const message = {
        id: result.insertId,
        text,
        image,
        senderId,
        receiverId,
        conversationId: conversation.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Error creating message' }, { status: 500 });
    }
  } else {
    const connection = await pool.getConnection();

    console.log('Database connection established:', !!connection);
    try {
      await connection.beginTransaction();

      // Conversation 생성
      const conversationSql = `
        INSERT INTO conversations (sender_id, receiver_id, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;
      const [conversationResult] = await connection.query<ResultSetHeader>(conversationSql, [senderId, receiverId]);

      console.log('Conversation Insert Result:', conversationResult);

      const newConversationId = conversationResult.insertId;

      // 중간 테이블(conversations_users)에 사용자 데이터 삽입
      const conversationsUsersSql = `
        INSERT INTO conversations_users (user_id, conversation_id)
        VALUES (?, ?), (?, ?)
      `;
      const [conversationsUsersResult] = await connection.query<ResultSetHeader>(conversationsUsersSql, [
        senderId,
        newConversationId,
        receiverId,
        newConversationId,
      ]);

      console.log('Conversations Users Insert Result:', conversationsUsersResult);

      // Message 생성
      const messageSql = `
        INSERT INTO messages (text, image, sender_id, receiver_id, conversation_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const [messageResult] = await connection.query<ResultSetHeader>(messageSql, [
        text,
        image,
        senderId,
        receiverId,
        newConversationId,
      ]);

      console.log('Message Insert Result:', messageResult);

      await connection.commit();

      const message = {
        id: messageResult.insertId,
        text,
        image,
        senderId,
        receiverId,
        conversationId: newConversationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json(message);
    } catch (error) {
      await connection.rollback();
      console.error('Error creating conversation and message:', error);
      return NextResponse.json({ error: 'Error creating conversation and message' }, { status: 500 });
    } finally {
      connection.release();
    }
  }
}
