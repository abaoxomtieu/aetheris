import { useQuery } from "@tanstack/react-query";
import { CareerRole } from "@shared/schema";

export function useCareerRoles() {
  const {
    data: careerRoles,
    isLoading,
    error,
  } = useQuery<CareerRole[]>({
    queryKey: ["/api/career-roles"],
    refetchOnWindowFocus: false,
  });

  return {
    careerRoles: careerRoles || [],
    isLoading,
    error,
  };
}

export function useCareerRole(id: number) {
  const {
    data: careerRole,
    isLoading,
    error,
  } = useQuery<CareerRole>({
    queryKey: ["/api/career-roles", id],
    refetchOnWindowFocus: false,
    enabled: !!id,
  });

  return {
    careerRole,
    isLoading,
    error,
  };
}