import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  // Use the API helper to get the correct URL based on environment
  const fullUrl = url.startsWith("/api/")
    ? apiUrl(url.substring(4)) // Remove the /api prefix as apiUrl adds it
    : url;

  console.log('API Request:', { method, url: fullUrl, credentials: 'include' });
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log('API Response:', { status: res.status, statusText: res.statusText });
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Convert the query key to a full URL using our API helper
    let url = queryKey[0] as string;
    if (url.startsWith("/api/")) {
      url = apiUrl(url.substring(4)); // Remove the /api prefix as apiUrl adds it
    }

    console.log('Query Request:', { url, credentials: 'include' });
    
    const res = await fetch(url, {
      credentials: "include",
    });

    console.log('Query Response:', { status: res.status, statusText: res.statusText });
    
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Unauthorized request handled with returnNull behavior');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
