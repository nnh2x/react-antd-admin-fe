import type { ReactElement } from "react";
import { isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { useMatches } from "react-router";

export function Iframe() {
	const matches = useMatches();
	const { t } = useTranslation();
	const currentRoute = matches[matches.length - 1];
	const iframeLink = currentRoute.handle?.iframeLink;
	const routeTitle = currentRoute.handle?.title;

	let title: string;
	if (isValidElement(routeTitle)) {
		// When routeTitle is a React element, try to read its children and translate them
		const children = (routeTitle as ReactElement<{ children: string }>)?.props?.children;
		title = typeof children === "string" ? t(children) : "";
	}
	else if (typeof routeTitle === "string") {
		title = routeTitle;
	}
	else {
		title = "";
	}

	/**
	 * use this tool https://iframegenerator.top/ to generate the iframe code
	 */
	return iframeLink
		? (
			<iframe
				src={iframeLink}
				title={title}
				width="100%"
				height="100%"
				loading="lazy"
				className="p-4 rounded-sm"
			/>
		)
		: null;
}
