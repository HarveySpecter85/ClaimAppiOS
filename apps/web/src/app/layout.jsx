import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LayoutWrapper from "@/components/LayoutWrapper";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </QueryClientProvider>
  );
}
