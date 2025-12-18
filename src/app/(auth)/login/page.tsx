import LoginForm from '@/components/form/LoginForm';
import { getServerUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

const LoginPage = async () => {
  const user = await getServerUser();

  if (user) {
    redirect('/');
  }

  return <LoginForm />;
};

export default LoginPage;
