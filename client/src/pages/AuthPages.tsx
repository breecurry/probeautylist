import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SignIn, SignUp, useOrganizationList } from '@clerk/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formText, optionalFormText } from '@/lib/forms';

type SignupRole = 'client' | 'professional' | 'business';

const signupRoleStorageKey = 'probeautylist.signupRole';
const signupRoles: Array<{ value: SignupRole; title: string; description: string }> = [
  {
    value: 'client',
    title: 'I am booking beauty services',
    description: 'Find professionals, save favorites, and request appointments.',
  },
  {
    value: 'professional',
    title: 'I am a beauty professional',
    description: 'Create your own profile, services, availability, portfolio, and booking workflow.',
  },
  {
    value: 'business',
    title: 'I own or manage a salon/business',
    description: 'Set up a salon, suite, or team account with organization access for staff.',
  },
];

function parseSignupRole(value: string | null): SignupRole {
  return value === 'professional' || value === 'business' ? value : 'client';
}

function destinationForRole(role: SignupRole) {
  if (role === 'client') return '/client';
  if (role === 'business') return '/business/onboarding';
  return '/professional/onboarding';
}

export function LoginPage() {
  const { user, clerkSignedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(destinationForRole(user.role === 'business' ? 'business' : user.role === 'professional' ? 'professional' : 'client'), { replace: true });
    }
  }, [loading, navigate, user]);

  if (clerkSignedIn && !user) {
    return <AccountTypeOnboarding />;
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage bookings, notifications, and profile details.">
      <SignIn routing="hash" forceRedirectUrl="/" signUpForceRedirectUrl="/auth/register" />
      <p className="mt-6 text-center text-sm text-ink/60">
        Need an account? <Link to="/auth/register" className="font-bold text-berry">Join Pro Beauty List</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, clerkSignedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = useMemo(() => parseSignupRole(searchParams.get('accountType') ?? window.localStorage.getItem(signupRoleStorageKey)), [searchParams]);
  const [selectedRole, setSelectedRole] = useState<SignupRole>(initialRole);

  useEffect(() => {
    window.localStorage.setItem(signupRoleStorageKey, selectedRole);
    setSearchParams({ accountType: selectedRole }, { replace: true });
  }, [selectedRole, setSearchParams]);

  useEffect(() => {
    if (!loading && user) {
      navigate(destinationForRole(user.role === 'business' ? 'business' : user.role === 'professional' ? 'professional' : 'client'), { replace: true });
    }
  }, [loading, navigate, user]);

  if (clerkSignedIn && !user) {
    return <AccountTypeOnboarding defaultRole={selectedRole} />;
  }

  return (
    <AuthShell title="Create your account" subtitle="Tell us who you are first so Clerk creates the right sign-up path for your account.">
      <RoleChooser selectedRole={selectedRole} onChange={setSelectedRole} />
      <div className="mt-8 rounded-3xl border border-rosewood/10 bg-white p-3 shadow-sm">
        <SignUp
          routing="hash"
          forceRedirectUrl={`/auth/register?accountType=${selectedRole}`}
          signInForceRedirectUrl="/auth/login"
          unsafeMetadata={{ accountType: selectedRole }}
        />
      </div>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already registered? <Link to="/auth/login" className="font-bold text-berry">Log in</Link>
      </p>
    </AuthShell>
  );
}

function AccountTypeOnboarding({ defaultRole = parseSignupRole(window.localStorage.getItem(signupRoleStorageKey)) }: { defaultRole?: SignupRole }) {
  const { syncUser, syncOrganization } = useAuth();
  const { createOrganization, setActive } = useOrganizationList();
  const navigate = useNavigate();
  const [role, setRole] = useState<SignupRole>(defaultRole);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const phone = optionalFormText(form, 'phone');
      const user = await syncUser({ role, phone });

      if (role === 'business') {
        const organizationName = formText(form, 'organizationName');
        if (!createOrganization) {
          throw new Error('Organization creation is still loading. Please try again.');
        }

        const organization = await createOrganization({ name: organizationName });
        if (setActive) {
          await setActive({ organization: organization.id });
        }
        await syncOrganization({ clerkOrgId: organization.id, name: organization.name, role: 'owner' });
      }

      window.localStorage.removeItem(signupRoleStorageKey);
      navigate(destinationForRole(user.role === 'business' ? 'business' : user.role === 'professional' ? 'professional' : 'client'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account setup failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Finish account setup" subtitle="Choose how you will use Pro Beauty List so your dashboard, profile, and organization access are created correctly.">
      <form onSubmit={onSubmit} className="space-y-6">
        <RoleChooser selectedRole={role} onChange={setRole} />
        <label className="label">Phone optional<input className="input mt-2" name="phone" autoComplete="tel" maxLength={40} /></label>
        {role === 'business' && (
          <label className="label">Salon or business name<input className="input mt-2" name="organizationName" minLength={1} maxLength={160} required /></label>
        )}
        {error && <FormError message={error} />}
        <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Setting up account...' : 'Finish setup'}
        </button>
      </form>
    </AuthShell>
  );
}

function RoleChooser({ selectedRole, onChange }: { selectedRole: SignupRole; onChange: (role: SignupRole) => void }) {
  return (
    <fieldset className="space-y-3">
      <legend className="label mb-3">Which account are you creating?</legend>
      {signupRoles.map((option) => (
        <label key={option.value} className={`block cursor-pointer rounded-3xl border p-4 transition ${selectedRole === option.value ? 'border-berry bg-blush/70 shadow-sm' : 'border-rosewood/10 bg-white hover:border-berry/40'}`}>
          <input
            className="sr-only"
            type="radio"
            name="accountType"
            value={option.value}
            checked={selectedRole === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="block text-base font-black text-ink">{option.title}</span>
          <span className="mt-1 block text-sm leading-6 text-ink/65">{option.description}</span>
        </label>
      ))}
    </fieldset>
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
