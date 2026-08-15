import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import {
	ProForm,
	ProFormText,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { Card, Col, Form, Row, theme, Typography } from "antd";
import { BasicContent } from "#src/components/basic-content";

import { FormAvatarItem } from "#src/components/basic-form";
import { useUserStore } from "#src/store/user";

const { Paragraph, Text, Title } = Typography;

export default function Profile() {
	const currentUser = useUserStore();
	const avatar = currentUser.avatar || "https://avatar.vercel.sh/blur.svg?text=2";
	const { token } = theme.useToken();

	const handleFinish = async () => {
		window.$message?.success("Basic information updated successfully");
	};

	return (
		<BasicContent className="mx-auto w-full max-w-5xl py-6 sm:py-8">
			<Card className="overflow-hidden shadow-sm" styles={{ body: { padding: 0 } }}>
				<ProForm
					layout="vertical"
					onFinish={handleFinish}
					initialValues={{
						...currentUser,
						avatar,
					}}
					requiredMark="optional"
					submitter={{
						searchConfig: { submitText: "Save changes" },
						resetButtonProps: { style: { display: "none" } },
						render: (_, buttons) => (
							<div
								className="flex justify-end border-t px-6 py-4 sm:px-10"
								style={{ borderColor: token.colorBorderSecondary, background: token.colorFillAlter }}
							>
								{buttons}
							</div>
						),
					}}
				>
					<div
						className="h-28 sm:h-36"
						style={{
							background: `linear-gradient(120deg, ${token.colorPrimary} 0%, ${token.colorInfo} 55%, ${token.colorPrimaryHover} 100%)`,
						}}
					/>

					<div className="px-6 sm:px-10">
						<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
							<div className="-mt-14 sm:-mt-12">
								<Form.Item
									name="avatar"
									rules={[{ required: true, message: "Please upload your avatar." }]}
									className="!mb-0"
								>
									<FormAvatarItem />
								</Form.Item>
							</div>
							<div className="pb-1 text-center sm:pb-4 sm:text-left">
								<Title level={3} className="!mb-1">{currentUser.username || "My Profile"}</Title>
								<Paragraph type="secondary" className="!mb-0">
									{currentUser.description || "Manage your personal information and contact details."}
								</Paragraph>
							</div>
						</div>

						<div className="pb-8 pt-8 sm:pb-10 sm:pt-10">
							<div className="mb-6">
								<Title level={4} className="!mb-1">Personal information</Title>
								<Text type="secondary">Keep your profile details accurate and up to date.</Text>
							</div>

							<Row gutter={[20, 0]}>
								<Col xs={24} sm={12}>
									<ProFormText
										name="username"
										label="Username"
										fieldProps={{ prefix: <UserOutlined className="text-gray-400" />, allowClear: true }}
										rules={[{ required: true, message: "Please enter your username." }]}
									/>
								</Col>
								<Col xs={24} sm={12}>
									<ProFormText
										name="email"
										label="Email"
										fieldProps={{ prefix: <MailOutlined className="text-gray-400" />, allowClear: true }}
										rules={[
											{ required: true, message: "Please enter your email." },
											{ type: "email", message: "Please enter a valid email address." },
										]}
									/>
								</Col>
							</Row>

							<Row gutter={[20, 0]}>
								<Col xs={24} sm={12}>
									<ProFormText
										name="phoneNumber"
										label="Phone number"
										fieldProps={{ prefix: <PhoneOutlined className="text-gray-400" />, allowClear: true }}
										rules={[
											{ required: true, message: "Please enter your phone number." },
											{ pattern: /^[+\d][\d\s()-]{6,19}$/, message: "Please enter a valid phone number." },
										]}
									/>
								</Col>
							</Row>
							<ProFormTextArea
								name="description"
								label="Bio"
								placeholder="Tell us a little about yourself"
								fieldProps={{ allowClear: true, showCount: true, maxLength: 200, autoSize: { minRows: 4, maxRows: 7 } }}
							/>
						</div>
					</div>
				</ProForm>
			</Card>
		</BasicContent>
	);
}
