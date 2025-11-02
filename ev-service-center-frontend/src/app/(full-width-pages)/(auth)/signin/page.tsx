import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Phần mềm quản lý bảo dưỡng xe điện cho trung tâm dịch vụ",
};

export default function SignIn() {
  return <SignInForm />;
}
