import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, Loader, Lock, Mail } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            // AuthContext will handle the redirect
        } catch (error: unknown) {
            setError((error as Error).message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
            <img src="/images/dugan-logo.png" alt="Logo" className="dp-logo" />
          <h1>Equipment Tracker</h1>
          <p>IT Department Access Only</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="itstaff@company.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-login"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="spinner" size={20} />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#" onClick={(e) => {
            e.preventDefault();
            alert('Please contact your IT administrator for password reset.');
          }}>
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login