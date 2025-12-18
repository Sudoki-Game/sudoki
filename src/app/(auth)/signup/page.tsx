import SignUpForm from '@/components/form/SignUpForm';
import { getServerUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

const SignUpPage = async () => {
  const user = await getServerUser();

  if (user) {
    redirect('/');
  }

  return <SignUpForm />;
};

export default SignUpPage;
