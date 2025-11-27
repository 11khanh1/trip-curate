import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PreferencesSelector from "@/components/preferences/PreferencesSelector";
import { sanitizePreferencesList } from "@/lib/preferences";
import { fetchProfile, PROFILE_QUERY_KEY, updateProfile } from "@/services/profileApi";
import { useUser } from "@/context/UserContext";

const buildDismissKey = (userId?: string | number | null) => `preferences_onboarding_dismissed_${userId ?? "unknown"}`;

const PreferencesOnboarding = () => {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    enabled: Boolean(currentUser) && currentUser?.role !== "admin" && currentUser?.role !== "partner",
    staleTime: 5 * 60 * 1000,
  });

  const initialPreferences = useMemo(
    () => sanitizePreferencesList(profileQuery.data?.preferences ?? []),
    [profileQuery.data?.preferences],
  );

  useEffect(() => {
    setSelected(initialPreferences);
  }, [initialPreferences, open]);

  const markDismissed = () => {
    if (!currentUser) return;
    const dismissKey = buildDismissKey(currentUser.id as string | number | undefined);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (!currentUser || (currentUser.role && currentUser.role !== "customer")) {
      setOpen(false);
      return;
    }
    if (profileQuery.isLoading || profileQuery.isFetching) return;

    const dismissKey = buildDismissKey(currentUser.id as string | number | undefined);
    const dismissed = (() => {
      try {
        return localStorage.getItem(dismissKey) === "1";
      } catch {
        return false;
      }
    })();

    if (initialPreferences.length === 0 && !dismissed) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [currentUser, profileQuery.isLoading, profileQuery.isFetching, initialPreferences.length]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: string[]) => updateProfile({ preferences }),
    onSuccess: (result, preferences) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, (prev: any) => {
        const merged = {
          ...(prev ?? {}),
          ...(result?.profile ?? {}),
          preferences,
        };
        return merged;
      });
      markDismissed();
      toast.success("Đã lưu sở thích của bạn!");
      setOpen(false);
    },
    onError: (error) => {
      const message =
        (error as any)?.response?.data?.message ??
        (error instanceof Error ? error.message : "Không thể lưu sở thích. Vui lòng thử lại.");
      toast.error(message);
    },
  });

  const handleSave = async () => {
    const cleaned = sanitizePreferencesList(selected);
    if (cleaned.length === 0) {
      markDismissed();
      setOpen(false);
      return;
    }
    await updatePreferencesMutation.mutateAsync(cleaned);
  };

  const handleSkip = () => {
    markDismissed();
    setOpen(false);
  };

  if (!currentUser || currentUser.role === "admin" || currentUser.role === "partner") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? handleSkip() : setOpen(true))}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cá nhân hóa trải nghiệm của bạn</DialogTitle>
          <DialogDescription>
            Chọn tối đa 10 sở thích để chúng tôi gợi ý hoạt động, điểm đến phù hợp. Bạn có thể thay đổi bất cứ lúc nào
            trong Hồ sơ.
          </DialogDescription>
        </DialogHeader>

        <PreferencesSelector
          value={selected}
          onChange={setSelected}
          label="Sở thích của bạn"
          description="Chọn từ gợi ý hoặc nhập tự do. Tối đa 10 mục, mỗi mục tối đa 50 ký tự."
          disabled={updatePreferencesMutation.isPending}
          compact
        />

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button type="button" variant="outline" onClick={handleSkip} disabled={updatePreferencesMutation.isPending}>
            Để sau
          </Button>
          <Button type="button" onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
            {updatePreferencesMutation.isPending ? "Đang lưu..." : "Lưu sở thích"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesOnboarding;
