import { redirect } from 'next/navigation';

export default function RegisterPage() {
  return redirect('/auth/login');
}
