import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: String(form.get('email')), password: String(form.get('password')) });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return <AuthShell title="Welcome back" subtitle="Log in to manage bookings, notifications, and profile details."><form onSubmit={onSubmit} className="space-y-4"><input className="input" name="email" type="email" placeholder="Email" required /><input className="input" name="password" type="password" placeholder="Password" required />{error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button className="primary-button w-full" type="submit">Log in</button><p className="text-center text-sm text-ink/60">Need an account? <Link to="/auth/register" className="font-bold text-berry">Register</Link></p></form></AuthShell>;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const role = String(form.get('role')) === 'professional' ? 'professional' : 'client';
    try {
      await register({
        firstName: String(form.get('firstName')),
        lastName: String(form.get('lastName')),
        email: String(form.get('email')),
        phone: String(form.get('phone') || ''),
        password: String(form.get('password')),
        role,
      });
      navigate(role === 'professional' ? '/professional/profile' : '/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return <AuthShell title="Create your account" subtitle="Clients can book online. Professionals can build a profile and manage bookings."><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><input className="input" name="firstName" placeholder="First name" required /><input className="input" name="lastName" placeholder="Last name" required /></div><input className="input" name="email" type="email" placeholder="Email" required /><input className="input" name="phone" placeholder="Phone optional" /><select className="input" name="role" defaultValue="client"><option value="client">I am booking services</option><option value="professional">I am a beauty professional</option></select><input className="input" name="password" type="password" minLength={10} placeholder="Password" required />{error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button className="primary-button w-full" type="submit">Create account</button><p className="text-center text-sm text-ink/60">Already registered? <Link to="/auth/login" className="font-bold text-berry">Log in</Link></p></form></AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center px-4 py-16"><div className="card w-full max-w-xl p-8"><h1 className="text-3xl font-black text-ink">{title}</h1><p className="mb-8 mt-3 leading-7 text-ink/65">{subtitle}</p>{children}</div></section>;
}
