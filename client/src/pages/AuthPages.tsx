import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formText, optionalFormText } from '@/lib/forms';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      await login({
        email: formText(form, 'email').toLowerCase(),
        password: String(form.get('password') ?? ''),
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage bookings, notifications, and profile details.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="label">Email<input className="input mt-2" name="email" type="email" autoComplete="email" required /></label>
        <label className="label">Password<input className="input mt-2" name="password" type="password" autoComplete="current-password" required /></label>
        {error && <FormError message={error} />}
        <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-center text-sm text-ink/60">
          Need an account? <Link to="/auth/register" className="font-bold text-berry">Register</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const role = String(form.get('role')) === 'professional' ? 'professional' : 'client';

    try {
      await register({
        firstName: formText(form, 'firstName'),
        lastName: formText(form, 'lastName'),
        email: formText(form, 'email').toLowerCase(),
        phone: optionalFormText(form, 'phone'),
        password: String(form.get('password') ?? ''),
        role,
      });
      navigate(role === 'professional' ? '/professional/profile' : '/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Clients can book online. Professionals can build a profile and manage bookings.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">First name<input className="input mt-2" name="firstName" autoComplete="given-name" minLength={1} maxLength={80} required /></label>
          <label className="label">Last name<input className="input mt-2" name="lastName" autoComplete="family-name" minLength={1} maxLength={80} required /></label>
        </div>
        <label className="label">Email<input className="input mt-2" name="email" type="email" autoComplete="email" required /></label>
        <label className="label">Phone optional<input className="input mt-2" name="phone" autoComplete="tel" maxLength={40} /></label>
        <label className="label">Account type<select className="input mt-2" name="role" defaultValue="client">
          <option value="client">I am booking services</option>
          <option value="professional">I am a beauty professional</option>
        </select></label>
        <label className="label">Password<input className="input mt-2" name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
        {error && <FormError message={error} />}
        <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-ink/60">
          Already registered? <Link to="/auth/login" className="font-bold text-berry">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center px-4 py-16">
      <div className="card w-full max-w-xl p-8">
        <h1 className="text-3xl font-black text-ink">{title}</h1>
        <p className="mb-8 mt-3 leading-7 text-ink/65">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

function FormError({ message }: { message: string }) {
  return <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}
