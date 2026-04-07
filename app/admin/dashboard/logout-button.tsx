'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface AdminLogoutButtonProps {
  className?: string;
}

export default function AdminLogoutButton({ className }: AdminLogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      className={className ?? 'cta-button max-w-xs'}
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
