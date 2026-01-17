import * as React from "react";

const useUser = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error("Failed to fetch user", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    data: user,
    loading,
    refetch: fetchUser,
  };
};

export { useUser };

export default useUser;
