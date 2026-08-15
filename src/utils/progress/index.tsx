import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
	// Animation easing
	easing: "ease",
	// Speed of the incrementing progress bar
	speed: 500,
	// Whether to show the loading icon
	showSpinner: false,
	// Auto-increment interval
	trickleSpeed: 200,
	// Minimum percentage on initialization
	minimum: 0.3,
});

export { NProgress };
