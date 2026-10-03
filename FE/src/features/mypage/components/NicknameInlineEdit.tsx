"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle, X, XCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/utils";
import { useDebouncedValue } from "@/shared/hooks";
import { userApi } from "@/shared/api/domains";
import pencilIcon from "@/assets/icons/mypage/pencil.svg?url";

export interface NicknameInlineEditRef {
  closeEdit: () => void;
}

interface NicknameInlineEditProps {
  nickname: string;
  isDuplicate?: boolean;
  onConfirm: (nickname: string) => void;
  onValueChange?: () => void;
}

const MAX_NICKNAME_LENGTH = 6;

export const NicknameInlineEdit = forwardRef<NicknameInlineEditRef, NicknameInlineEditProps>(
  ({ nickname, isDuplicate = false, onConfirm, onValueChange }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const trimmed = value.trim();
    const debouncedNickname = useDebouncedValue(isEditing ? trimmed : "", 400);
    const canCheck =
      isEditing && debouncedNickname.length >= 2 && debouncedNickname.length <= MAX_NICKNAME_LENGTH;

    // 저장 전 실시간 중복 확인. 제출 시 409로 잡히는 isDuplicate와 별개로,
    // 타이핑 중에도 바로 알려주기 위한 조회 전용 체크.
    const { data: availability } = useQuery({
      queryKey: userApi.keys.nicknameAvailability(debouncedNickname),
      queryFn: () => userApi.checkNicknameAvailability({ nickname: debouncedNickname }),
      enabled: canCheck,
      staleTime: 10_000,
    });

    const isLiveDuplicate = canCheck && availability?.available === false;
    const showDuplicate = isDuplicate || isLiveDuplicate;

    const isValid = trimmed.length >= 2 && trimmed.length <= MAX_NICKNAME_LENGTH && !showDuplicate;

    useEffect(() => {
      if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const openEdit = () => {
      setValue("");
      setIsEditing(true);
    };

    const closeEdit = () => {
      setValue("");
      setIsEditing(false);
      onValueChange?.();
    };

    // 부모에서 ref.current.closeEdit() 호출로 편집 모드 종료 가능
    useImperativeHandle(ref, () => ({ closeEdit }));

    const handleConfirm = () => {
      if (!isValid) return;
      onConfirm(value.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleConfirm();
      if (e.key === "Escape") closeEdit();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      setValue(
        nextValue.length <= MAX_NICKNAME_LENGTH
          ? nextValue
          : nextValue.slice(0, MAX_NICKNAME_LENGTH),
      );
      onValueChange?.();
    };

    return (
      <div className="inline-flex flex-col items-center gap-1">
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-text-heading leading-none">{nickname}</span>
            <button
              type="button"
              aria-label="닉네임 편집"
              onClick={openEdit}
              className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-system-scroll transition-opacity active:opacity-60"
            >
              <Image src={pencilIcon} alt="닉네임 편집" width={10} height={10} />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-1 border-b",
              showDuplicate ? "border-sub-coral" : "border-main-blue",
            )}
          >
            <input
              ref={inputRef}
              value={value}
              maxLength={MAX_NICKNAME_LENGTH}
              placeholder="6자 이내로 입력해주세요"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-[140px] bg-transparent text-left text-md font-medium text-text-heading leading-none py-0.5 outline-none placeholder:text-xs placeholder:font-normal placeholder:text-sub-gray"
            />
            <button
              type="button"
              aria-label="닉네임 저장"
              onClick={handleConfirm}
              disabled={!isValid}
              className={cn(
                "group flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors active:opacity-70",
                isValid
                  ? "border-sub-deepblue bg-transparent hover:bg-main-blue"
                  : "border-transparent bg-system-navbg",
              )}
            >
              <Check
                size={10}
                className={cn(
                  "transition-colors",
                  isValid ? "text-sub-deepblue group-hover:text-main-white" : "text-sub-gray",
                )}
              />
            </button>

            <button
              type="button"
              aria-label="닉네임 편집 취소"
              onClick={closeEdit}
              className="group flex size-4 shrink-0 items-center justify-center rounded-full border border-sub-coral bg-transparent transition-colors hover:bg-sub-coral active:opacity-70"
            >
              <X
                size={10}
                className="text-sub-coral transition-colors group-hover:text-main-white"
              />
            </button>
          </div>
        )}

        {isEditing && (showDuplicate || isValid) && (
          <div className="mt-0.5 flex items-center gap-1">
            {showDuplicate ? (
              <>
                <XCircle size={12} className="shrink-0 text-sub-coral" />
                <span className="text-2xs font-semibold text-sub-coral">
                  이미 사용중인 닉네임이에요.
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={12} className="shrink-0 text-main-blue" />
                <span className="text-2xs font-semibold text-main-blue">
                  사용 가능한 닉네임이에요.
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
);

NicknameInlineEdit.displayName = "NicknameInlineEdit";
