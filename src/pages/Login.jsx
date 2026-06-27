import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import Seo from "@/components/Seo";

export default function Login() {
  const handleGoogle = () => {
    // After sign-in, land directly on the Application Board so admins / staff
    // get straight to their workspace instead of the marketing homepage.
    base44.auth.loginWithProvider("google", "/ApplicationBoard");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
    >
      <Seo
        title="Log in | Pilates in Pink™"
        description="Sign in to the Pilates in Pink™ Application Board."
        path="/login"
        noindex
      />
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>
    </AuthLayout>
  );
}