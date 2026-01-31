import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// ユーザー情報（実際の環境では環境変数やデータベースから取得）
const USERS = [
  {
    username: 'mugen2026',
    // パスワード: maedaoguramugen
    passwordHash: '$2b$10$ZUGdbvbhdIRCBX376Tjzley8.OcnI9zQkJXn3Fk4X7fGUlDtbzQd.',
  },
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-please-use-env-variable';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // ユーザーを検索
    const user = USERS.find((u) => u.username === username);

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーIDまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'ユーザーIDまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWTトークンを生成（2時間の有効期限）
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

    // HTTPOnly Cookieにトークンを設定
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 2, // 2時間
      path: '/',
    };

    console.log('[Login] Setting cookie with options:', cookieOptions);
    cookieStore.set('auth-token', token, cookieOptions);

    return NextResponse.json({ success: true, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
