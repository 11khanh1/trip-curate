import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser, type User as AccountUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User as UserIcon,
  Lock,
  Bell,
  CreditCard,
  Globe,
  Shield,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Star,
} from "lucide-react";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isPastDate, isValidVietnamPhone, normalizeVietnamPhone } from "@/lib/validators";
import { fetchProfile, updateProfile, PROFILE_QUERY_KEY, type UserProfile, type UpdateProfilePayload } from "@/services/profileApi";
import {
  fetchNotificationSettings,
  toggleNotifications,
  type NotificationToggleResponse,
} from "@/services/notificationApi";
import PreferencesSelector from "@/components/preferences/PreferencesSelector";
import { sanitizePreferencesList, arePreferencesEqual } from "@/lib/preferences";


type SectionType = "profile" | "security" | "notifications" | "payment" | "preferences";

type NotificationSettings = {
  promotionalEmails: boolean;
  bookingUpdates: boolean;
  travelTips: boolean;
  reminders: boolean;
};

type PaymentMethod = {
  id: string;
  brand: "visa" | "mastercard" | "amex" | "jcb" | "other";
  cardholder: string;
  cardNumber: string;
  expiry: string;
  isDefault: boolean;
};

type PreferenceSettings = {
  language: string;
  currency: string;
  timezone: string;
};

type SecuritySettings = {
  password: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
};

type AccountLocalSettings = {
  notifications: NotificationSettings;
  paymentMethods: PaymentMethod[];
  preferences: PreferenceSettings;
  security: SecuritySettings;
};

type NotificationKey = keyof NotificationSettings;

type PaymentFormState = {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  brand: PaymentMethod["brand"];
};

const SETTINGS_STORAGE_KEY = "accountSettings";

const createDefaultSettings = (): AccountLocalSettings => ({
  notifications: {
    promotionalEmails: true,
    bookingUpdates: true,
    travelTips: true,
    reminders: true,
  },
  paymentMethods: [],
  preferences: {
    language: "vi",
    currency: "vnd",
    timezone: "asia/ho_chi_minh",
  },
  security: {
    password: "",
    twoFactorEnabled: false,
    lastPasswordChange: "",
  },
});

const mergeSettingsWithDefaults = (stored?: Partial<AccountLocalSettings> | null): AccountLocalSettings => {
  const defaults = createDefaultSettings();
  if (!stored) {
    return defaults;
  }
  return {
    notifications: { ...defaults.notifications, ...(stored.notifications || {}) },
    paymentMethods: stored.paymentMethods ?? defaults.paymentMethods,
    preferences: { ...defaults.preferences, ...(stored.preferences || {}) },
    security: { ...defaults.security, ...(stored.security || {}) },
  };
};

const createEmptyPaymentForm = (): PaymentFormState => ({
  cardholder: "",
  cardNumber: "",
  expiry: "",
  brand: "visa",
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  const response = (error as any)?.response;
  if (response?.data?.message) return response.data.message;
  return fallback;
};

const AccountSettings = () => {
  const { currentUser, setCurrentUser } = useUser();
  const [activeSection, setActiveSection] = useState<SectionType>("profile");
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    dateOfBirth: currentUser?.dateOfBirth || "",
    gender: currentUser?.gender || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountSettings, setAccountSettings] = useState<AccountLocalSettings>(() => createDefaultSettings());
  const [profilePreferences, setProfilePreferences] = useState<string[]>([]);
  const [preferencesForm, setPreferencesForm] = useState<PreferenceSettings>(() => createDefaultSettings().preferences);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(() => createEmptyPaymentForm());
  const queryClient = useQueryClient();
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: profileError,
  } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const profileLoadError = profileError instanceof Error ? profileError.message : null;
  const isProfileBusy = isProfileSaving || isProfileLoading;

  const {
    data: notificationSettings,
    isLoading: isNotificationLoading,
    refetch: refetchNotificationSettings,
  } = useQuery<NotificationToggleResponse>({
    queryKey: ["notification-settings"],
    queryFn: () => fetchNotificationSettings(),
    staleTime: 2 * 60 * 1000,
  });

  const notificationToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleNotifications(enabled),
    onSettled: () => refetchNotificationSettings(),
  });

  const persistUserFromProfile = useCallback(
    (profile: UserProfile) => {
      if (!profile) return;
      setCurrentUser((prev) => {
        const previousUser = prev ?? { name: "", email: "" };
        const merged: AccountUser = {
          ...previousUser,
          name: profile.name ?? previousUser.name ?? "",
          email: profile.email ?? previousUser.email ?? "",
          phone: profile.phone ?? previousUser.phone,
          address: profile.address_line1 ?? previousUser.address,
          gender: profile.gender ?? previousUser.gender,
          dateOfBirth: profile.date_of_birth ?? previousUser.dateOfBirth,
        };
        try {
          localStorage.setItem("user", JSON.stringify(merged));
        } catch (error) {
          console.warn("Không thể lưu user vào localStorage:", error);
        }
        return merged;
      });
    },
    [setCurrentUser],
  );

  useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      dateOfBirth: currentUser.dateOfBirth || "",
      gender: currentUser.gender || "",
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!profileData) return;
    setFormData((prev) => ({
      ...prev,
      name: profileData.name || prev.name,
      email: profileData.email || prev.email,
      phone: profileData.phone || prev.phone,
      gender: profileData.gender || prev.gender,
      dateOfBirth: profileData.date_of_birth || prev.dateOfBirth,
      addressLine1: profileData.address_line1 || "",
      addressLine2: profileData.address_line2 || "",
      city: profileData.city || "",
      state: profileData.state || "",
      postalCode: profileData.postal_code || "",
      country: profileData.country || "",
    }));
    setProfilePreferences(sanitizePreferencesList(profileData.preferences ?? []));
    persistUserFromProfile(profileData);
  }, [profileData, persistUserFromProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<AccountLocalSettings>;
        const merged = mergeSettingsWithDefaults(parsed);
        setAccountSettings(merged);
        setPreferencesForm(merged.preferences);
      }
    } catch (error) {
      console.error("Không thể tải cài đặt đã lưu:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof notificationSettings?.enabled !== "boolean") return;
    const enabled = notificationSettings.enabled;
    setAccountSettings((prev) => {
      const nextNotifications = Object.keys(prev.notifications).reduce<NotificationSettings>(
        (acc, key) => ({
          ...acc,
          [key]: enabled,
        }),
        prev.notifications,
      );
      const nextState = { ...prev, notifications: nextNotifications };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextState));
      } catch (error) {
        console.warn("Không thể lưu trạng thái thông báo:", error);
      }
      return nextState;
    });
  }, [notificationSettings?.enabled]);

  const menuItems = [
    { id: "profile" as SectionType, label: "Hồ sơ của tôi", icon: UserIcon },
    { id: "security" as SectionType, label: "Bảo mật", icon: Lock },
    { id: "notifications" as SectionType, label: "Thông báo", icon: Bell },
    { id: "payment" as SectionType, label: "Thanh toán", icon: CreditCard },
    { id: "preferences" as SectionType, label: "Tùy chọn", icon: Globe },
  ];

  const notificationOptions: { key: NotificationKey; title: string; description: string }[] = [
    {
      key: "promotionalEmails",
      title: "Email khuyến mãi",
      description: "Nhận thông tin ưu đãi, chương trình giảm giá và voucher mới nhất",
    },
    {
      key: "bookingUpdates",
      title: "Cập nhật đặt chỗ",
      description: "Thông báo về trạng thái đặt chỗ, thanh toán và thay đổi lịch trình",
    },
    {
      key: "travelTips",
      title: "Tin tức và mẹo du lịch",
      description: "Gợi ý điểm đến, hành trình đang hot và các kinh nghiệm hữu ích",
    },
    {
      key: "reminders",
      title: "Nhắc nhở sắp tới",
      description: "Thông báo trước các hoạt động đã lên lịch và việc cần chuẩn bị",
    },
  ];

  const paymentBrandOptions = [
    { value: "visa" as const, label: "Visa" },
    { value: "mastercard" as const, label: "Mastercard" },
    { value: "amex" as const, label: "American Express" },
    { value: "jcb" as const, label: "JCB" },
    { value: "other" as const, label: "Khác" },
  ];
  const getPaymentBrandLabel = (brand: PaymentMethod["brand"]) =>
    paymentBrandOptions.find((option) => option.value === brand)?.label || "Phương thức khác";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const persistSettings = (
    updater: (prev: AccountLocalSettings) => AccountLocalSettings,
    message?: string,
  ) => {
    setAccountSettings((prev) => {
      const nextState = updater(prev);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextState));
      return nextState;
    });
    if (message) {
      toast.success(message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && !isValidVietnamPhone(formData.phone)) {
      toast.error("⚠️ Số điện thoại không hợp lệ. Vui lòng nhập 10 số bắt đầu bằng 0 hoặc +84.");
      return;
    }
    if (formData.dateOfBirth && !isPastDate(formData.dateOfBirth)) {
      toast.error("⚠️ Ngày sinh phải trước ngày hiện tại.");
      return;
    }

    const payload: UpdateProfilePayload = {};
    type UpdateProfileStringKey = Exclude<keyof UpdateProfilePayload, "preferences">;
    const previous = profileData ?? null;
    const appendIfChanged = (
      value: string,
      original: string | null | undefined,
      key: UpdateProfileStringKey,
      transform?: (val: string) => string,
    ) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const nextValue = transform ? transform(trimmed) : trimmed;
      const currentValue = (original ?? "").trim();
      if (currentValue === nextValue) return;
      payload[key] = nextValue;
    };

    appendIfChanged(formData.name, previous?.name, "name");
    appendIfChanged(formData.email, previous?.email, "email");
    appendIfChanged(formData.phone, previous?.phone, "phone", normalizeVietnamPhone);
    appendIfChanged(formData.gender, previous?.gender, "gender");
    appendIfChanged(formData.dateOfBirth, previous?.date_of_birth, "date_of_birth");
    appendIfChanged(formData.addressLine1, previous?.address_line1, "address_line1");
    appendIfChanged(formData.addressLine2, previous?.address_line2, "address_line2");
    appendIfChanged(formData.city, previous?.city, "city");
    appendIfChanged(formData.state, previous?.state, "state");
    appendIfChanged(formData.postalCode, previous?.postal_code, "postal_code");
    appendIfChanged(formData.country, previous?.country, "country");
    const cleanedPreferences = sanitizePreferencesList(profilePreferences);
    const previousPreferences = sanitizePreferencesList(previous?.preferences ?? []);
    if (!arePreferencesEqual(cleanedPreferences, previousPreferences)) {
      payload.preferences = cleanedPreferences;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Không có thay đổi nào cần lưu.");
      return;
    }

    setIsProfileSaving(true);
    try {
      const result = await updateProfile(payload);
      const mergedProfile: UserProfile = {
        ...(profileData ?? {}),
        ...payload,
        ...(result.profile ?? {}),
      };
      if (payload.preferences) {
        setProfilePreferences(payload.preferences);
      }
      queryClient.setQueryData(PROFILE_QUERY_KEY, mergedProfile);
      persistUserFromProfile(mergedProfile);
      toast.success(result.message || "Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("❌ Mật khẩu xác nhận không khớp!");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("⚠️ Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    if (accountSettings.security.password && formData.currentPassword !== accountSettings.security.password) {
      toast.error("❌ Mật khẩu hiện tại chưa chính xác!");
      return;
    }

    const changedAt = new Date().toISOString();
    persistSettings(
      (prev) => ({
        ...prev,
        security: {
          ...prev.security,
          password: formData.newPassword,
          lastPasswordChange: changedAt,
        },
      }),
      "✅ Đổi mật khẩu thành công!",
    );
    setFormData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleNotificationToggle = (key: NotificationKey, label: string, value: boolean) => {
    const nextNotifications = {
      ...accountSettings.notifications,
      [key]: value,
    };
    const enabled = Object.values(nextNotifications).some(Boolean);

    setIsNotificationSaving(true);
    setAccountSettings((prev) => ({
      ...prev,
      notifications: nextNotifications,
    }));

    notificationToggleMutation.mutate(enabled, {
      onSuccess: (data) => {
        const finalEnabled =
          typeof data?.enabled === "boolean" ? data.enabled : enabled;
        const updated = Object.keys(nextNotifications).reduce<NotificationSettings>((acc, currentKey) => {
          const currentValue = nextNotifications[currentKey as NotificationKey];
          return {
            ...acc,
            [currentKey]: finalEnabled ? currentValue : false,
          };
        }, nextNotifications);
        persistSettings(
          (prev) => ({
            ...prev,
            notifications: updated,
          }),
          `${finalEnabled ? "Đã bật" : "Đã tắt"} ${label.toLowerCase()}`,
        );
      },
      onError: (error) => {
        setAccountSettings((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: !value,
          },
        }));
        toast.error(getErrorMessage(error, "Không thể cập nhật cài đặt thông báo."));
      },
      onSettled: () => setIsNotificationSaving(false),
    });
  };

  const handleToggleTwoFactor = (value: boolean) => {
    persistSettings(
      (prev) => ({
        ...prev,
        security: {
          ...prev.security,
          twoFactorEnabled: value,
        },
      }),
      value ? "Đã bật xác thực hai yếu tố" : "Đã tắt xác thực hai yếu tố",
    );
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferencesForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePreferences = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    persistSettings(
      (prev) => ({
        ...prev,
        preferences: { ...preferencesForm },
      }),
      "Đã lưu tùy chọn hiển thị!",
    );
  };

  const formatCardNumberInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 19);
    return digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  };

  const maskCardNumber = (value: string) => {
    const digits = value.replace(/\s+/g, "");
    if (digits.length <= 4) {
      return digits;
    }
    const masked = digits.slice(0, -4).replace(/\d/g, "*") + digits.slice(-4);
    return masked.replace(/(.{4})/g, "$1 ").trim();
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: name === "cardNumber" ? formatCardNumberInput(value) : value,
    }));
  };

  const isValidExpiry = (value: string) => {
    const match = /^(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return false;
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const fullYear = 2000 + year;
    if (fullYear < now.getFullYear()) return false;
    if (fullYear === now.getFullYear() && month < now.getMonth() + 1) return false;
    return true;
  };

  const handleAddPaymentMethod = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentForm.cardholder.trim()) {
      toast.error("Vui lòng nhập tên chủ thẻ");
      return;
    }

    const sanitizedCardNumber = paymentForm.cardNumber.replace(/\s+/g, "");
    if (!/^\d{12,19}$/.test(sanitizedCardNumber)) {
      toast.error("Số thẻ phải gồm 12-19 chữ số");
      return;
    }

    if (!isValidExpiry(paymentForm.expiry)) {
      toast.error("Ngày hết hạn không hợp lệ. Định dạng MM/YY và chưa hết hạn.");
      return;
    }

    persistSettings(
      (prev) => {
        const isFirstCard = prev.paymentMethods.length === 0;
        const newMethod: PaymentMethod = {
          id: `${Date.now()}`,
          brand: paymentForm.brand,
          cardholder: paymentForm.cardholder.trim(),
          cardNumber: sanitizedCardNumber,
          expiry: paymentForm.expiry,
          isDefault: isFirstCard,
        };
        return {
          ...prev,
          paymentMethods: [...prev.paymentMethods, newMethod],
        };
      },
      "Đã thêm phương thức thanh toán",
    );
    setPaymentForm(createEmptyPaymentForm());
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    persistSettings(
      (prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((method) => ({
          ...method,
          isDefault: method.id === id,
        })),
      }),
      "Đã đặt phương thức mặc định",
    );
  };

  const handleRemovePaymentMethod = (id: string) => {
    persistSettings(
      (prev) => {
        const remaining = prev.paymentMethods.filter((method) => method.id !== id);
        if (remaining.length === 0) {
          return { ...prev, paymentMethods: [] };
        }
        if (!remaining.some((method) => method.isDefault)) {
          return {
            ...prev,
            paymentMethods: remaining.map((method, index) =>
              index === 0 ? { ...method, isDefault: true } : method,
            ),
          };
        }
        return { ...prev, paymentMethods: remaining };
      },
      "Đã xóa phương thức thanh toán",
    );
  };

  const lastPasswordChangeLabel = accountSettings.security.lastPasswordChange
    ? new Date(accountSettings.security.lastPasswordChange).toLocaleString("vi-VN")
    : "Chưa có lịch sử";


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TravelHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Cài đặt tài khoản</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <Card className="p-4">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Hồ sơ của tôi</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý thông tin cá nhân của bạn</p>
                  </div>
                  <CardContent className="p-6">
                    {profileLoadError && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {profileLoadError}
                      </div>
                    )}
                    <form onSubmit={handleUpdateProfile}>
                      <fieldset disabled={isProfileBusy} className="space-y-6">
                        {/* Profile Photo */}
                        <div className="flex items-center gap-6 pb-6 border-b">
                          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="w-10 h-10 text-primary" />
                          </div>
                          <div>
                            <Button type="button" variant="outline" size="sm">
                              Thay đổi ảnh
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">JPG, PNG hoặc GIF. Tối đa 2MB</p>
                          </div>
                        </div>

                        {(isProfileLoading || isProfileFetching) && (
                          <p className="text-sm text-gray-500">Đang tải dữ liệu hồ sơ...</p>
                        )}

                        {/* Personal Information */}
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-sm font-medium">
                                Họ và tên <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên"
                                className="h-11"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gender" className="text-sm font-medium">
                                Giới tính
                              </Label>
                              <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full h-11 px-3 border rounded-lg bg-white"
                              >
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="email@example.com"
                                className="h-11"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Số điện thoại
                              </Label>
                              <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+84 xxx xxx xxx"
                                className="h-11"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Ngày sinh
                            </Label>
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            className="h-11"
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="addressLine1" className="text-sm font-medium">
                              Địa chỉ dòng 1
                            </Label>
                            <Input
                              id="addressLine1"
                              name="addressLine1"
                              value={formData.addressLine1}
                              onChange={handleInputChange}
                              placeholder="Số nhà, đường"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addressLine2" className="text-sm font-medium">
                              Địa chỉ dòng 2
                            </Label>
                            <Input
                              id="addressLine2"
                              name="addressLine2"
                              value={formData.addressLine2}
                              onChange={handleInputChange}
                              placeholder="Phường/Xã, Tòa nhà (tuỳ chọn)"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium">
                              Thành phố
                            </Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Thành phố"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium">
                              Tỉnh/Bang
                            </Label>
                            <Input
                              id="state"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              placeholder="Tỉnh/Bang"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="postalCode" className="text-sm font-medium">
                              Mã bưu điện
                            </Label>
                            <Input
                              id="postalCode"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              placeholder="Mã bưu điện"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-sm font-medium">
                              Quốc gia
                            </Label>
                            <Input
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              placeholder="Quốc gia"
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                          <PreferencesSelector
                            value={profilePreferences}
                            onChange={setProfilePreferences}
                            label="Sở thích du lịch"
                            description="Chọn từ gợi ý hoặc nhập tự do. Tối đa 10 mục, mỗi mục tối đa 50 ký tự."
                            disabled={isProfileBusy}
                          />
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                          <Button type="submit" className="bg-primary hover:bg-primary/90 px-8" disabled={isProfileBusy}>
                            {isProfileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                          </Button>
                        </div>
                      </fieldset>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Bảo mật</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý mật khẩu và bảo mật tài khoản</p>
                  </div>
                  <CardContent className="p-6 space-y-8">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-medium">
                            Mật khẩu hiện tại <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="h-11"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium">
                            Mật khẩu mới <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập lại mật khẩu mới"
                            className="h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                        <p>
                          Lần cập nhật mật khẩu gần nhất:{" "}
                          <span className="font-medium text-gray-900">{lastPasswordChangeLabel}</span>
                        </p>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </form>

                    <Separator />

                    <div className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">Xác thực hai yếu tố</h3>
                            <p className="text-sm text-gray-600">
                              Tăng cường bảo mật tài khoản bằng mã xác thực mỗi khi đăng nhập
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">
                              {accountSettings.security.twoFactorEnabled ? "Đang bật" : "Đang tắt"}
                            </span>
                            <Switch
                              checked={accountSettings.security.twoFactorEnabled}
                              onCheckedChange={handleToggleTwoFactor}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          {accountSettings.security.twoFactorEnabled
                            ? "Chúng tôi sẽ gửi mã xác thực về email/điện thoại khi bạn đăng nhập."
                            : "Bật tính năng này để thêm một lớp bảo vệ cho tài khoản của bạn."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý cách bạn nhận thông báo</p>
                  </div>
                  <CardContent className="p-6 divide-y">
                    {notificationOptions.map((option) => (
                      <div key={option.key} className="flex items-start justify-between py-5">
                        <div className="flex-1 pr-6">
                          <h4 className="font-medium text-gray-900">{option.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden text-sm text-gray-500 md:inline">
                            {accountSettings.notifications[option.key] ? "Đang bật" : "Đang tắt"}
                          </span>
                          <Switch
                            checked={accountSettings.notifications[option.key]}
                            disabled={isNotificationSaving || isNotificationLoading || notificationToggleMutation.isPending}
                            onCheckedChange={(checked) => handleNotificationToggle(option.key, option.title, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Payment Section */}
              {activeSection === "payment" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý thẻ và phương thức thanh toán</p>
                  </div>
                  <CardContent className="p-6 space-y-8">
                    {accountSettings.paymentMethods.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Chưa có phương thức thanh toán</h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                          Thêm thẻ tín dụng hoặc phương thức thanh toán để đặt chỗ nhanh chóng và thuận tiện hơn
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {accountSettings.paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                {getPaymentBrandLabel(method.brand)}
                              </p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {maskCardNumber(method.cardNumber)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">Hết hạn: {method.expiry}</p>
                            </div>
                            <div className="flex flex-col gap-2 text-sm font-medium text-primary">
                              {method.isDefault && (
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <Star className="w-4 h-4 fill-primary text-primary" />
                                  Mặc định
                                </span>
                              )}
                              <span className="text-gray-500">Chủ thẻ: {method.cardholder}</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {!method.isDefault && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                >
                                  Đặt mặc định
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRemovePaymentMethod(method.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="rounded-xl bg-gray-50 p-5">
                      <h3 className="font-semibold text-gray-900">Thêm phương thức thanh toán mới</h3>
                      <form onSubmit={handleAddPaymentMethod} className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="cardholder" className="text-sm font-medium">
                              Tên chủ thẻ
                            </Label>
                            <Input
                              id="cardholder"
                              name="cardholder"
                              value={paymentForm.cardholder}
                              onChange={handlePaymentFormChange}
                              placeholder="Ví dụ: NGUYEN VAN A"
                              className="h-11 uppercase"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="brand" className="text-sm font-medium">
                              Loại thẻ
                            </Label>
                            <select
                              id="brand"
                              name="brand"
                              value={paymentForm.brand}
                              onChange={handlePaymentFormChange}
                              className="w-full h-11 rounded-lg border bg-white px-3"
                            >
                              {paymentBrandOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber" className="text-sm font-medium">
                              Số thẻ
                            </Label>
                            <Input
                              id="cardNumber"
                              name="cardNumber"
                              value={paymentForm.cardNumber}
                              onChange={handlePaymentFormChange}
                              placeholder="0000 0000 0000 0000"
                              inputMode="numeric"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiry" className="text-sm font-medium">
                              Ngày hết hạn
                            </Label>
                            <Input
                              id="expiry"
                              name="expiry"
                              value={paymentForm.expiry}
                              onChange={handlePaymentFormChange}
                              placeholder="MM/YY"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" className="bg-primary hover:bg-primary/90 px-6">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Thêm phương thức
                          </Button>
                        </div>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences Section */}
              {activeSection === "preferences" && (
                <Card>
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Tùy chọn</h2>
                    <p className="text-sm text-gray-600 mt-1">Cá nhân hóa trải nghiệm của bạn</p>
                  </div>
                  <CardContent className="p-6">
                    <form onSubmit={handleSavePreferences} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Ngôn ngữ hiển thị
                        </Label>
                        <select
                          name="language"
                          value={preferencesForm.language}
                          onChange={handlePreferencesChange}
                          className="w-full h-11 px-3 border rounded-lg bg-white"
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                          <option value="zh">中文 (简体)</option>
                          <option value="ja">日本語</option>
                          <option value="ko">한국어</option>
                          <option value="th">ไทย</option>
                        </select>
                        <p className="text-xs text-gray-500">Chọn ngôn ngữ bạn muốn sử dụng trên trang web</p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Đơn vị tiền tệ</Label>
                        <select
                          name="currency"
                          value={preferencesForm.currency}
                          onChange={handlePreferencesChange}
                          className="w-full h-11 px-3 border rounded-lg bg-white"
                        >
                          <option value="vnd">VND - Đồng Việt Nam (₫)</option>
                          <option value="usd">USD - Dollar Mỹ ($)</option>
                          <option value="eur">EUR - Euro (€)</option>
                          <option value="jpy">JPY - Yên Nhật (¥)</option>
                          <option value="krw">KRW - Won Hàn Quốc (₩)</option>
                          <option value="thb">THB - Baht Thái (฿)</option>
                        </select>
                        <p className="text-xs text-gray-500">Chọn đơn vị tiền tệ để hiển thị giá</p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Múi giờ</Label>
                        <select
                          name="timezone"
                          value={preferencesForm.timezone}
                          onChange={handlePreferencesChange}
                          className="w-full h-11 px-3 border rounded-lg bg-white"
                        >
                          <option value="asia/ho_chi_minh">(GMT+7) Hà Nội, TP. Hồ Chí Minh</option>
                          <option value="asia/bangkok">(GMT+7) Bangkok</option>
                          <option value="asia/singapore">(GMT+8) Singapore</option>
                          <option value="asia/tokyo">(GMT+9) Tokyo</option>
                          <option value="asia/seoul">(GMT+9) Seoul</option>
                        </select>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                          Lưu tùy chọn
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;
