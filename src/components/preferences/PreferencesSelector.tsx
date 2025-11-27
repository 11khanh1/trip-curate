import { useEffect, useMemo, useState, type KeyboardEventHandler } from "react";
import { X, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_PREFERENCE_LENGTH, MAX_PREFERENCES, sanitizePreferenceValue, sanitizePreferencesList } from "@/lib/preferences";
import { fetchPreferenceOptions, PREFERENCE_OPTIONS_QUERY_KEY, type PreferenceOption } from "@/services/preferencesApi";

interface PreferencesSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  compact?: boolean;
}

const PreferencesSelector = ({
  value,
  onChange,
  label,
  description,
  placeholder,
  disabled,
  error,
  compact,
}: PreferencesSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const { data: options = [], isLoading, refetch } = useQuery({
    queryKey: PREFERENCE_OPTIONS_QUERY_KEY,
    queryFn: fetchPreferenceOptions,
    staleTime: 10 * 60 * 1000,
  });

  const normalizedSelected = useMemo(() => sanitizePreferencesList(value ?? []), [value]);
  const optionMap = useMemo(() => {
    return options.reduce<Record<string, PreferenceOption>>((acc, option) => {
      acc[option.value.toLowerCase()] = option;
      return acc;
    }, {});
  }, [options]);

  const availableOptions = useMemo(
    () =>
      options.filter(
        (option) => !normalizedSelected.some((pref) => pref.toLowerCase() === option.value.toLowerCase()),
      ),
    [options, normalizedSelected],
  );

  const limitReached = normalizedSelected.length >= MAX_PREFERENCES;

  useEffect(() => {
    if (!error) return;
    setNotice(error);
  }, [error]);

  const handleAdd = (rawValue: string) => {
    const cleaned = sanitizePreferenceValue(rawValue);
    if (!cleaned) {
      setNotice("Vui lòng nhập nội dung hợp lệ.");
      return;
    }
    if (normalizedSelected.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setNotice("Sở thích đã có trong danh sách.");
      setInputValue("");
      return;
    }
    if (normalizedSelected.length >= MAX_PREFERENCES) {
      setNotice(`Tối đa ${MAX_PREFERENCES} sở thích.`);
      return;
    }
    setNotice(null);
    onChange([...normalizedSelected, cleaned]);
    setInputValue("");
  };

  const handleRemove = (pref: string) => {
    const next = normalizedSelected.filter((item) => item.toLowerCase() !== pref.toLowerCase());
    onChange(next);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd(inputValue);
    }
  };

  const counterLabel = `${normalizedSelected.length}/${MAX_PREFERENCES}`;

  return (
    <div className={cn("space-y-3", compact ? "mt-2" : "mt-4")}>
      {(label || description) && (
        <div className="flex items-center justify-between gap-3">
          <div>
            {label ? <Label className="text-sm font-medium">{label}</Label> : null}
            {description ? <p className="text-xs text-gray-500">{description}</p> : null}
          </div>
          <span className="text-xs text-gray-500">{counterLabel}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Nhập hoặc chọn sở thích (tối đa 50 ký tự)"}
            maxLength={MAX_PREFERENCE_LENGTH}
            disabled={disabled || limitReached}
            className="h-11"
          />
          <Button
            type="button"
            onClick={() => handleAdd(inputValue)}
            disabled={disabled || limitReached || !inputValue.trim()}
            className="whitespace-nowrap"
          >
            Thêm
          </Button>
        </div>
     
        {notice ? <p className="text-xs text-amber-600">{notice}</p> : null}
      </div>

      {normalizedSelected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {normalizedSelected.map((pref) => {
            const option = optionMap[pref.toLowerCase()];
            const displayLabel = option?.label ?? pref;
            return (
              <Badge
                key={pref}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20"
              >
                {displayLabel}
                <button
                  type="button"
                  onClick={() => handleRemove(pref)}
                  className="ml-1 text-primary hover:text-primary/80"
                  aria-label={`Xoá ${displayLabel}`}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500"></p>
      )}

      <div className="rounded-lg border bg-white p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Sparkles className="h-4 w-4 text-orange-500" />
            Gợi ý phổ biến
          </div>
          {isLoading ? <span className="text-xs text-gray-500">Đang tải...</span> : null}
          {!isLoading && options.length === 0 ? (
            <button type="button" className="text-xs text-orange-600 hover:underline" onClick={() => refetch()}>
              Thử tải lại
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableOptions.length === 0 && !isLoading ? (
            <p className="text-xs text-gray-500">Không còn gợi ý khả dụng.</p>
          ) : null}
          {availableOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || limitReached}
              onClick={() => handleAdd(option.value)}
              className="border-dashed"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreferencesSelector;
