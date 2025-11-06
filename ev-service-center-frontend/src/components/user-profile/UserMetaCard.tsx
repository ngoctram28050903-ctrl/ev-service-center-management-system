"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";
import { updateUser } from "@/services/userService";
import { User } from "@/types/common";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";

const UserMetaCard = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        avatar: parsedUser.avatar || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (formData.password && formData.password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      const payload: Record<string, unknown> = {};
      if (formData.name && formData.name !== user.name) payload.name = formData.name.trim();
      if (formData.email && formData.email !== user.email) payload.email = formData.email.trim();
      if (formData.phone && formData.phone !== user.phone) payload.phone = formData.phone.trim();
      if (formData.avatar && formData.avatar !== (user as User).avatar) payload.avatar = formData.avatar.trim();
      if (formData.password) payload.password = formData.password;

      if (Object.keys(payload).length === 0) {
        closeModal();
        return;
      }

      const updatedUser = await updateUser(user.id.toString(), payload as unknown as User);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Cập nhật thông tin thành công");
      closeModal();
    } catch (error: unknown) {
      console.log(error);
      toast.error(getErrorMessage(error, "Cập nhật thông tin thất bại"));
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            {user?.avatar && (
              <Image
                width={80}
                height={80}
                src="/images/user/Client.jpg"
                alt="user"
              />
            )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.username}
              </h4>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Thông tin cá nhân
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Tên người dùng
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.username}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

            {/* <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Số điện thoại
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.phone}
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Thông tin cá nhân
            </h4>
          </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 lg:col-span-1">
                <Label>Họ tên</Label>
                <Input type="text" name="name" value={formData.name} onChange={handleInputChange} />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Email</Label>
                <Input type="text" name="email" value={formData.email} onChange={handleInputChange} />
              </div>

              {/* <div className="col-span-2 lg:col-span-1">
                <Label>Số điện thoại</Label>
                <Input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Ảnh đại diện (URL)</Label>
                <Input type="text" name="avatar" value={formData.avatar} onChange={handleInputChange} />
              </div> */}

              <div className="col-span-2 lg:col-span-1">
                <Label>Mật khẩu mới</Label>
                <Input type="password" name="password" value={formData.password} onChange={handleInputChange} />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Nhập lại mật khẩu</Label>
                <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Đóng
              </Button>
              <Button size="sm" onClick={() => handleSubmit()}>
                Lưu thay đổi
              </Button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default UserMetaCard;
