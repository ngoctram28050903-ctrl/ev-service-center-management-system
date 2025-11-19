import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Phần mềm quản lý bảo dưỡng xe điện cho trung tâm dịch vụ",
};

export default function SignUp() {
  return <SignUpForm />;
}
