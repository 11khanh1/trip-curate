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

const Index = () => {
  const homeQuery = useQuery({
    queryKey: ["public-home", { categories_limit: 6, promotions_limit: 3, trending_limit: 12 }],
    queryFn: () =>
      fetchHome({
        categories_limit: 6,
        promotions_limit: 3,
        trending_limit: 8,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const homeData = homeQuery.data;
  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      <HeroSection />
      <FeaturedDeals promotions={homeData?.promotions} />
      <PopularActivities tours={homeData?.trending} />
      <FeaturesSection />
      <TopDestinations categories={homeData?.categories} />
      <AppDownload />
      <Footer />
    </div>
  );
};

export default Index;
