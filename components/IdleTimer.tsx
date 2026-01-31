'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface IdleTimerProps {
  /**
   * アイドルタイムアウト時間（ミリ秒）
   * デフォルト: 2時間 (7200000ms)
   */
  timeout?: number;
}

export default function IdleTimer({ timeout = 7200000 }: IdleTimerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ログインページではタイマーを動作させない
  const isLoginPage = pathname === '/login';

  const resetTimer = () => {
    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // ログインページではタイマーを設定しない
    if (isLoginPage) {
      return;
    }

    // 新しいタイマーを設定
    timerRef.current = setTimeout(() => {
      // アイドルタイムアウト時の処理
      handleLogout();
    }, timeout);
  };

  const handleLogout = async () => {
    try {
      // ログアウトAPIを呼び出し
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ログインページにリダイレクト
      router.push('/login?reason=idle');
    }
  };

  useEffect(() => {
    // ログインページではタイマーを設定しない
    if (isLoginPage) {
      return;
    }

    // ユーザーアクティビティイベント
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // イベントリスナーを追加
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // 初回タイマー設定
    resetTimer();

    // クリーンアップ
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isLoginPage, timeout]);

  // このコンポーネントは何もレンダリングしない
  return null;
}
