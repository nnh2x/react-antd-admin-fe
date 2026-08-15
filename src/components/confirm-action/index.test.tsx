import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmAction } from ".";

describe("confirmAction", () => {
	it("runs the action only after confirmation", async () => {
		const onConfirm = vi.fn();
		const user = userEvent.setup();
		const view = render(<ConfirmAction onConfirm={onConfirm}>Remove</ConfirmAction>);

		await user.click(view.getByRole("button", { name: /remove/i }));
		expect(onConfirm).not.toHaveBeenCalled();

		await user.click(await view.findByRole("button", { name: /ok/i }));
		expect(onConfirm).toHaveBeenCalledOnce();
	});
});
