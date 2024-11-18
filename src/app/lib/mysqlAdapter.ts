import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from './db';
import { AdapterSession } from 'next-auth/adapters';
import { User } from '@/types/user';
import _ from 'lodash';

interface Session extends AdapterSession {
  sessionToken: string;
  userId: string;
  expires: Date;
}

const MySQLAdapter = {
  async getConversationByUsers(
    senderId: string,
    receiverId: string
  ): Promise<{
    id: string;
    name: string | null;
    createdAt: Date | null;
  } | null> {
    try {
      const sql = `
        SELECT 
          c.id AS conversationId,
          c.name AS conversationName,
          c.created_at AS conversationCreatedAt
        FROM 
          conversations c
        INNER JOIN 
          conversations_users cu1 ON c.id = cu1.conversation_id
        INNER JOIN 
          conversations_users cu2 ON c.id = cu2.conversation_id
        WHERE 
          cu1.user_id = ? AND cu2.user_id = ?
        LIMIT 1;
      `;

      const [rows] = await pool.query<RowDataPacket[]>(sql, [senderId, receiverId]);

      if (rows.length === 0) {
        return null; // 대화가 없는 경우 null 반환
      }

      const row = rows[0];

      return {
        id: row.conversationId,
        name: row.conversationName,
        createdAt: row.conversationCreatedAt ? new Date(row.conversationCreatedAt) : null,
      };
    } catch (error) {
      console.error('Database query error in getConversationByUsers:', error);
      throw new Error('Error fetching conversation by users.');
    }
  },
  async getUsersWithConversations() {
    try {
      const sql = `
        SELECT 
          u.id AS userId,
          u.name AS userName,
          u.email AS userEmail,
          u.image AS userImage,
          c.id AS conversationId,
          c.name AS conversationName,
          c.created_at AS conversationCreatedAt,
          m.id AS messageId,
          m.text AS messageText,
          m.image AS messageImage,
          m.created_at AS messageCreatedAt,
          m.updated_at AS messageUpdatedAt,
          sender.id AS senderId,
          sender.name AS senderName,
          sender.email AS senderEmail,
          sender.image AS senderImage,
          receiver.id AS receiverId,
          receiver.name AS receiverName,
          receiver.email AS receiverEmail,
          receiver.image AS receiverImage
        FROM 
          users u
        LEFT JOIN 
          conversations_users cu ON u.id = cu.user_id
        LEFT JOIN 
          conversations c ON cu.conversation_id = c.id
        LEFT JOIN 
          messages m ON c.id = m.conversation_id
        LEFT JOIN 
          users sender ON m.sender_id = sender.id
        LEFT JOIN 
          users receiver ON m.receiver_id = receiver.id
        ORDER BY 
          m.created_at ASC;
      `;

      const [rows] = await pool.query<RowDataPacket[]>(sql);

      // 1. 사용자별로 그룹화
      const groupedUsers = _.groupBy(rows, 'userId');

      // 2. 사용자 데이터 매핑
      return Object.keys(groupedUsers).map((userId) => {
        const userRows = groupedUsers[userId];

        // 사용자 정보
        const userInfo = {
          id: userRows[0].userId,
          name: userRows[0].userName,
          email: userRows[0].userEmail,
          image: userRows[0].userImage,
        };

        // 대화 정보 매핑
        const conversations = _(userRows)
          .groupBy('conversationId')
          .map((conversationRows, conversationId) => ({
            id: conversationId,
            name: conversationRows[0].conversationName,
            createdAt: conversationRows[0].conversationCreatedAt
              ? new Date(conversationRows[0].conversationCreatedAt)
              : null,
            messages: conversationRows
              .filter((row) => row.messageId)
              .map((row) => ({
                id: row.messageId,
                text: row.messageText,
                image: row.messageImage,
                createdAt: row.messageCreatedAt ? new Date(row.messageCreatedAt) : null,
                updatedAt: row.messageUpdatedAt ? new Date(row.messageUpdatedAt) : null,
                sender: row.senderId
                  ? {
                      id: row.senderId,
                      name: row.senderName,
                      email: row.senderEmail,
                      image: row.senderImage,
                    }
                  : null,
                receiver: row.receiverId
                  ? {
                      id: row.receiverId,
                      name: row.receiverName,
                      email: row.receiverEmail,
                      image: row.receiverImage,
                    }
                  : null,
              })),
            users: _.uniqBy(
              conversationRows.flatMap((row) => [
                { id: row.senderId, name: row.senderName },
                { id: row.receiverId, name: row.receiverName },
              ]),
              'id'
            ),
          }))
          .value();

        return {
          ...userInfo,
          conversations,
        };
      });
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Error fetching users with conversations.');
    }
  },

  async getProductWithUser(productId: string) {
    try {
      const sql = `
      SELECT 
      p.id AS productId,
      p.title AS productTitle,
      p.description AS productDescription,
      p.imageSrc AS productImageSrc,
      p.category AS productCategory,
      p.latitude AS productLatitude,
      p.longitude AS productLongitude,
      p.price AS productPrice,
      p.userId AS productUserId,
      p.createdAt AS productCreatedAt,
      p.updatedAt AS productUpdatedAt,
      u.id AS userId,
      u.name AS userName,
      u.email AS userEmail,
      u.image AS userImage,
      u.email_verified AS userEmailVerified
    FROM 
      products p
    JOIN 
      users u 
    ON 
      p.userId = u.id
    WHERE 
      p.id = ?;
      `;

      // 쿼리 실행
      const [rows] = await pool.query<RowDataPacket[]>(sql, [productId]);

      if (rows.length === 0) {
        return null; // 제품이 없는 경우 null 반환
      }

      const row = rows[0];

      // 결과 객체 생성
      const product = {
        id: row.productId, // SQL에서 'productId'로 반환
        title: row.productTitle, // SQL에서 'productTitle'로 반환
        description: row.productDescription,
        imageSrc: row.productImageSrc,
        category: row.productCategory,
        latitude: row.productLatitude,
        longitude: row.productLongitude,
        price: row.productPrice,
        userId: row.productUserId,
        createdAt: new Date(row.productCreatedAt),
        user: {
          id: row.userId,
          name: row.userName ?? null,
          email: row.userEmail,
          image: row.userImage ?? null,
          emailVerified: row.userEmailVerified ?? null, // SQL에서 'userEmailVerified'로 반환
          hashedPassword: null,
          favoriteIds: [],
        },
      };

      return product;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Error fetching product with user data.');
    }
  },

  async getProducts(query: Record<string, any> = {}, skip: number = 0, limit: number) {
    const whereClauses = [];
    const values = [];

    if (query.category) {
      whereClauses.push(`category = ?`);
      values.push(query.category);
    }
    if (query.latitude) {
      whereClauses.push(`latitude BETWEEN ? AND ?`);
      values.push(query.latitude.min, query.latitude.max);
    }
    if (query.longitude) {
      whereClauses.push(`longitude BETWEEN ? AND ?`);
      values.push(query.longitude.min, query.longitude.max);
    }

    const sql = `
      SELECT * FROM products
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;

    // 페이지네이션을 위해 LIMIT과 OFFSET 값을 추가
    values.push(limit); // LIMIT 값 추가
    values.push(skip); // OFFSET 값 추가

    try {
      const [rows] = await pool.query<RowDataPacket[]>(sql, values);

      const products = rows.map((row) => ({
        id: row.id.toString(),
        title: row.title,
        description: row.description,
        imageSrc: row.imageSrc,
        category: row.category,
        latitude: row.latitude,
        longitude: row.longitude,
        price: row.price,
        userId: row.userId,
        createdAt: new Date(row.createdAt),
      }));

      return products;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Error fetching products from the database.');
    }
  },

  async getTotalProductCount(query: Record<string, any> = {}) {
    const whereClauses = [];
    const values = [];

    if (query.category) {
      whereClauses.push(`category = ?`);
      values.push(query.category);
    }
    if (query.latitude) {
      whereClauses.push(`latitude BETWEEN ? AND ?`);
      values.push(query.latitude.min, query.latitude.max);
    }
    if (query.longitude) {
      whereClauses.push(`longitude BETWEEN ? AND ?`);
      values.push(query.longitude.min, query.longitude.max);
    }

    const countSql = `
      SELECT COUNT(*) AS totalItems FROM products
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    `;

    try {
      const [[{ totalItems }]] = await pool.query<RowDataPacket[]>(countSql, values);
      return totalItems;
    } catch (error) {
      console.error('Database count query error:', error);
      throw new Error('Error counting products in the database.');
    }
  },

  async createProduct({
    title,
    description,
    imageSrc,
    category,
    latitude,
    longitude,
    price,
    userId,
  }: {
    title: string;
    description: string;
    imageSrc: string;
    category: string;
    latitude: number;
    longitude: number;
    price: number;
    userId: string;
  }): Promise<{
    id: string;
    title: string;
    description: string;
    imageSrc: string;
    category: string;
    latitude: number;
    longitude: number;
    price: number;
    userId: string;
  }> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO products (title, description, imageSrc, category, latitude, longitude, price, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, imageSrc, category, latitude, longitude, price, userId]
    );

    return {
      id: result.insertId.toString(),
      title,
      description,
      imageSrc,
      category,
      latitude,
      longitude,
      price,
      userId,
    };
  },
  async getUser(id: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? (rows[0] as User) : null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] ? (rows[0] as User) : null;
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const { name, email, image, role } = user;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, image, role) VALUES (?, ?, ?,?)',
      [name, email, image, role]
    );
    return { id: result.insertId.toString(), name, email, image, role, emailVerified: null };
  },

  async updateUser(user: Partial<User> & { id: string }): Promise<User> {
    const { id, name, email, image, favoriteIds } = user;

    // favoriteIds가 있을 경우 JSON 문자열로 변환
    const favoriteIdsJson = favoriteIds ? JSON.stringify(favoriteIds) : null;

    await pool.query('UPDATE users SET name = ?, email = ?, image = ?, favoriteIds = ? WHERE id = ?', [
      name ?? null,
      email ?? null,
      image ?? null,
      favoriteIdsJson,
      id,
    ]);

    // 업데이트 후, 업데이트된 사용자 정보를 다시 조회하여 반환
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
    const updatedUser = rows[0];

    return {
      id: updatedUser.id.toString(),
      name: updatedUser.name ?? null,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified ?? null,
      image: updatedUser.image ?? null,
      hashedPassword: updatedUser.hashedPassword ?? null,
      favoriteIds: typeof updatedUser.favoriteIds === 'string' ? JSON.parse(updatedUser.favoriteIds) : [], // JSON 파싱하여 배열로 반환
    };
  },

  async deleteUser(userId: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  },

  async linkAccount(account: {
    userId: string;
    provider: string;
    providerAccountId: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    idToken?: string;
    sessionState?: string;
  }): Promise<void> {
    const {
      userId,
      provider,
      providerAccountId,
      refreshToken,
      accessToken,
      expiresAt,
      tokenType,
      scope,
      idToken,
      sessionState,
    } = account;
    await pool.query(
      'INSERT INTO accounts (user_id, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        provider,
        providerAccountId,
        refreshToken,
        accessToken,
        expiresAt,
        tokenType,
        scope,
        idToken,
        sessionState,
      ]
    );
  },

  async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }): Promise<void> {
    await pool.query('DELETE FROM accounts WHERE provider = ? AND provider_account_id = ?', [
      provider,
      providerAccountId,
    ]);
  },

  async getSessionAndUser(sessionToken: string): Promise<{ session: Session; user: User } | null> {
    const [sessions] = await pool.query<RowDataPacket[]>('SELECT * FROM sessions WHERE session_token = ?', [
      sessionToken,
    ]);
    const session = sessions[0];
    if (!session) return null;

    const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [session.user_id]);
    return {
      session: {
        sessionToken: session.session_token,
        userId: session.user_id,
        expires: new Date(session.expires),
      } as Session,
      user: users[0] as User,
    };
  },

  async createSession(session: Session): Promise<AdapterSession> {
    const { sessionToken, userId, expires } = session;
    await pool.query('INSERT INTO sessions (session_token, user_id, expires) VALUES (?, ?, ?)', [
      sessionToken,
      userId,
      expires,
    ]);
    return session;
  },

  async updateSession(session: Partial<Session> & { sessionToken: string }): Promise<AdapterSession | null> {
    const { sessionToken, userId, expires } = session;
    const query =
      'UPDATE sessions SET expires = COALESCE(?, expires), user_id = COALESCE(?, user_id) WHERE session_token = ?';
    await pool.query(query, [expires, userId, sessionToken]);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM sessions WHERE session_token = ?', [sessionToken]);
    const updatedSession = rows[0];

    return updatedSession
      ? ({
          sessionToken: updatedSession.session_token,
          userId: updatedSession.user_id,
          expires: new Date(updatedSession.expires),
        } as AdapterSession)
      : null;
  },

  async deleteSession(sessionToken: string): Promise<void> {
    await pool.query('DELETE FROM sessions WHERE session_token = ?', [sessionToken]);
  },

  async createVerificationToken(verificationToken: {
    identifier: string;
    token: string;
    expires: Date;
  }): Promise<{ identifier: string; token: string; expires: Date }> {
    const { identifier, token, expires } = verificationToken;
    await pool.query('INSERT INTO verificationtokens (identifier, token, expires) VALUES (?, ?, ?)', [
      identifier,
      token,
      expires,
    ]);
    return verificationToken;
  },

  async useVerificationToken({
    identifier,
    token,
  }: {
    identifier: string;
    token: string;
  }): Promise<{ identifier: string; token: string; expires: Date } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM verificationtokens WHERE identifier = ? AND token = ?',
      [identifier, token]
    );
    const verificationToken = rows[0];
    if (verificationToken) {
      await pool.query('DELETE FROM verificationtokens WHERE identifier = ? AND token = ?', [identifier, token]);
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: new Date(verificationToken.expires),
      };
    }
    return null;
  },
};

export default MySQLAdapter;
