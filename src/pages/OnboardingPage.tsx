import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [brokerCode, setBrokerCode] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [brokerLookupError, setBrokerLookupError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // If profile is already complete, redirect
  if (userProfile?.displayName && userProfile?.phone) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleBrokerLookup = async () => {
    if (!brokerCode) return;
    setBrokerLookupError('');
    try {
      const q = query(collection(db, 'users'), where('brokerCode', '==', brokerCode), where('role', '==', 'broker'));
      const snap = await getDocs(q);
      if (snap.empty) {
        setBrokerLookupError('Invalid broker code. Please check with your broker.');
        return;
      }
      const brokerDoc = snap.docs[0];
      setBrokerName(brokerDoc.data().displayName || 'Unknown Broker');
      return brokerDoc.id;
    } catch {
      setBrokerLookupError('Could not verify broker code. Try again.');
      return null;
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      let brokerId = userProfile?.brokerId;
      if (brokerCode && userProfile?.role === 'agent') {
        const q = query(collection(db, 'users'), where('brokerCode', '==', brokerCode), where('role', '==', 'broker'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          brokerId = snap.docs[0].id;
        }
      }
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phone,
        licenseNumber: licenseNumber || '',
        brokerId: brokerId || '',
        isActive: true,
      } as Record<string, unknown>);
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white dark:bg-gray-950 p-8 shadow-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {s}
              </div>
              {s < 3 && <div className={cn('h-1 w-12 rounded', step > s ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome! 👋</h1>
          <p className="text-muted-foreground">Let's set up your profile</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="+63 912 345 6789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License / Accreditation #</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="HLURB / DHSUD license number (optional)"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!displayName || !phone}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Broker Setup (for agents) */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Broker Connection</h2>
            <p className="text-sm text-muted-foreground">
              {userProfile?.role === 'broker'
                ? 'As a broker, you can skip this step.'
                : 'Enter your broker\'s code to connect to their team.'}
            </p>

            {userProfile?.role === 'agent' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Broker Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={brokerCode}
                      onChange={(e) => { setBrokerCode(e.target.value); setBrokerName(''); }}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="Enter broker code"
                    />
                    <button
                      onClick={handleBrokerLookup}
                      disabled={!brokerCode}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                  {brokerLookupError && <p className="text-sm text-destructive mt-1">{brokerLookupError}</p>}
                  {brokerName && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      ✓ Connected to {brokerName}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Don't have a code? You can join a broker later from Settings.
                </p>
              </>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">
                Back
              </button>
              <button onClick={() => setStep(3)} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {userProfile?.role === 'broker' ? 'Skip' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-lg font-semibold">You're all set!</h2>
            <p className="text-sm text-muted-foreground">
              Your account is ready.{' '}
              {userProfile?.role === 'broker'
                ? 'Start by inviting agents and adding listings.'
                : 'Start capturing leads and scheduling viewings.'}
            </p>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Setting up...' : 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
