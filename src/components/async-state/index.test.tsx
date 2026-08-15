import { render } from "@testing-library/react";
import { AsyncState } from ".";

describe("asyncState", () => {
	it("renders children in the ready state", () => {
		const view = render(<AsyncState><div>Ready content</div></AsyncState>);
		expect(view.getByText("Ready content")).toBeInTheDocument();
	});

	it("prioritizes errors over empty state", () => {
		const view = render(<AsyncState error={new Error("Request failed")} isEmpty><div>Hidden</div></AsyncState>);
		expect(view.getByText("Request failed")).toBeInTheDocument();
		expect(view.queryByText("Hidden")).not.toBeInTheDocument();
	});

	it("renders a configurable empty state", () => {
		const view = render(<AsyncState isEmpty emptyTitle="No users"><div>Hidden</div></AsyncState>);
		expect(view.getByText("No users")).toBeInTheDocument();
	});
});
