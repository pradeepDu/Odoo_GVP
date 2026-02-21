import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { showApiError } from "@/lib/toast";
import { AuthLayout } from "@/components/auth-layout";
import {
  NeoBrutalCard,
  NeoBrutalTitle,
  NeoBrutalSubtitle,
  NeoBrutalLabel,
  NeoBrutalInput,
  NeoBrutalButton,
  NeoBrutalError,
  NeoBrutalSuccess,
  NeoBrutalHelperText,
} from "@/components/ui/neo-brutual-card";
import { Button } from "@/components/ui/button";


export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <NeoBrutalCard>
        <NeoBrutalTitle>New Password</NeoBrutalTitle>
        <NeoBrutalSubtitle>Enter your new password below</NeoBrutalSubtitle>

        {success ? (
          <div className="space-y-6">
            <NeoBrutalSuccess>
              <p className="font-black uppercase">Password reset successful!</p>
              <p className="mt-1 text-xs">Redirecting you to login...</p>
            </NeoBrutalSuccess>
            <div className="text-center text-sm font-bold">
              <Link
                to="/login"
                className="text-black underline underline-offset-4 hover:text-black/70"
              >
                Go to login now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <NeoBrutalError>{error}</NeoBrutalError>}

            <div>
              <NeoBrutalLabel htmlFor="password">New Password</NeoBrutalLabel>
              <div className="relative">
                <NeoBrutalInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER NEW PASSWORD"
                  minLength={6}
                  required
                  className="pr-20"
                />
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black uppercase text-black/50 hover:text-black transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
              <NeoBrutalHelperText>Minimum 6 characters</NeoBrutalHelperText>
            </div>

            <div>
              <NeoBrutalLabel htmlFor="confirmPassword">Confirm New Password</NeoBrutalLabel>
              <NeoBrutalInput
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="CONFIRM NEW PASSWORD"
                required
              />
            </div>

            <NeoBrutalButton disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </NeoBrutalButton>

            <div className="text-center text-sm font-bold">
              <Link
                to="/login"
                className="text-black/60 underline underline-offset-4 hover:text-black transition-colors"
              >
                {"<- Back to Login"}
              </Link>
            </div>
          </form>
        )}
      </NeoBrutalCard>
    </AuthLayout>
  );
}
