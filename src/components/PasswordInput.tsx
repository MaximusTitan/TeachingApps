"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
}

export function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
