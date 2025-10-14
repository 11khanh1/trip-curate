import { useQuery } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import HeroSection from "@/components/HeroSection";
import FeaturedDeals from "@/components/FeaturedDeals";
import PopularActivities from "@/components/PopularActivities";
import FeaturesSection from "@/components/FeaturesSection";
import TopDestinations from "@/components/TopDestinations";
import AppDownload from "@/components/AppDownload";
import Footer from "@/components/Footer";
import { fetchHome } from "@/services/publicApi";

const HOME_LIMITS = {
  categories_limit: 6,
  promotions_limit: 5,
  trending_limit: 8,
} as const;

const Index = () => {
  const homeQuery = useQuery({
    queryKey: ["home", HOME_LIMITS],
    queryFn: () => fetchHome(HOME_LIMITS),
    staleTime: 5 * 60 * 1000,
  });

  const categories = homeQuery.data?.categories ?? [];
  const promotions = homeQuery.data?.promotions ?? [];
  const trendingTours = homeQuery.data?.trending ?? [];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      <HeroSection />
      <FeaturedDeals promotions={promotions} isLoading={homeQuery.isLoading} />
      <PopularActivities tours={trendingTours} isLoading={homeQuery.isLoading} />
      <FeaturesSection />
      <TopDestinations categories={categories} isLoading={homeQuery.isLoading} />
      <AppDownload />
      <Footer />
    </div>
  );
};

export default Index;
