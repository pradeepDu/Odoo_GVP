import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Forgot password</CardTitle>
          <p className="text-muted-foreground text-sm">
            Contact your administrator to reset your password. (Placeholder — integrate email reset later.)
          </p>
        </CardHeader>
        <CardContent>
          <Link to="/login" className="text-primary text-sm hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
