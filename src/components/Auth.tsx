import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function Auth() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const action = isSignUp ? signUpWithEmail : signInWithEmail;
    const { error } = await action(email, password);

    if (error) {
      setError(error.message);
    } else if (isSignUp) {
      alert('Signup successful! You can now sign in.');
      setIsSignUp(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-textPrimary mb-2">Vellichor</h1>
          <p className="text-textSecondary">Your elegant, cloud-based tech notebook.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-textPrimary text-surface hover:bg-black font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="text-center mb-6">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-accent hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-textSecondary">Or continue with</span>
          </div>
        </div>
        
        <button
          onClick={signInWithGoogle}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google
        </button>
      </div>
    </div>
  );
}
