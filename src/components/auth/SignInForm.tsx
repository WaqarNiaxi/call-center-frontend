'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { setUser } from '@/store/userSlice';
import { useAppDispatch } from '@/hooks/useTypedHooks';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';

export default function SignInPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post('/auth/login', { email, password });
      const { access_token, user } = res.data;

      localStorage.setItem('token', access_token);

      dispatch(
        setUser({
          id:user.id,
          email: user.email,
          token:access_token,
          role: user.role,
          center: user.center || null,
        })
      );

      router.replace('/');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Side: Form */}
      <div className="w-full  flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sign In</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input
                placeholder="info@gmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? '👁' : '🙈'}
                </span>
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>

     
    </div>
  );
}
