import type { ReactNode } from "react";
import { useAccess } from "#src/hooks/use-access";

export interface AccessControlProps {
	codes?: string | string[]
	roles?: string | string[]
	strategy?: "all" | "any"
	fallback?: ReactNode
	children: ReactNode
}

/** Declarative UI authorization. Backend authorization remains mandatory. */
export function AccessControl({
	codes,
	roles,
	strategy = "all",
	fallback = null,
	children,
}: AccessControlProps) {
	const { hasAccessByCodes, hasAccessByRoles } = useAccess();
	const checks = [
		...(codes ? [hasAccessByCodes(codes)] : []),
		...(roles ? [hasAccessByRoles(roles)] : []),
	];
	const allowed = checks.length > 0 && (strategy === "all" ? checks.every(Boolean) : checks.some(Boolean));

	return allowed ? children : fallback;
}
