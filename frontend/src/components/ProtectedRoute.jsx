import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import Loader from "./Loader";

export default function ProtectedRoute({
  children,
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setAllowed(true);
    }

    setLoading(false);
  }

  if (loading) return <Loader />;

  if (!allowed) return <Navigate to="/" />;

  return children;
}