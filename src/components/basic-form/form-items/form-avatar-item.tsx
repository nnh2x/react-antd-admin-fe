import { UploadOutlined } from "@ant-design/icons";

import { Avatar, Button, theme, Upload } from "antd";
import ImgCrop from "antd-img-crop";

interface FormAvatarItemProps {
	value?: string
	onChange?: (value: any) => void
}

export function FormAvatarItem({ value, onChange }: FormAvatarItemProps) {
	const { token } = theme.useToken();

	return (
		<div className="flex flex-col items-center gap-3 sm:items-start">
			<div
				className="rounded-full p-1 shadow-lg"
				style={{ background: token.colorBgContainer }}
			>
				<Avatar size={112} src={value} />
			</div>
			<ImgCrop
				rotationSlider
				aspectSlider
				showReset
				showGrid
				cropShape="round"
			>
				<Upload
					accept="image/*"
					showUploadList={false}
					name="file"
					action={`${import.meta.env.VITE_API_BASE_URL}/upload`}
					headers={{
						authorization: "authorization-text",
					}}
					onChange={(info) => {
						if (info.file.status === "done") {
							window.$message?.success(`${info.file.name} file uploaded successfully`);
							onChange?.(info.file.response?.result);
						}
						else if (info.file.status === "error") {
							window.$message?.error(`${info.file.name} file upload failed.`);
						}
					}}
				>
					<Button type="text" size="small" icon={<UploadOutlined />}>
						Change photo
					</Button>
				</Upload>
			</ImgCrop>
		</div>
	);
}
