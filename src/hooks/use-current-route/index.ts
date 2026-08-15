import { useMemo } from "react";
import { useMatches } from "react-router";

/**
 * Get the current route information
 *
 * @returns The match result for the current route
 */
export function useCurrentRoute() {
	const matches = useMatches();

	const currentRoute = useMemo(() => {
		const match = matches[matches.length - 1];

		return match;
	}, [matches, location]);

	return currentRoute;
}
