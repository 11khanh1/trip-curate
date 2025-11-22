import { useQuery } from "@tanstack/react-query";
import TravelHeader from "@/components/TravelHeader";
import HeroSection from "@/components/HeroSection";
import FeaturedDeals from "@/components/FeaturedDeals";
import PopularActivities from "@/components/PopularActivities";
import PersonalizedRecommendations from "@/components/recommendations/PersonalizedRecommendations";
import FeaturesSection from "@/components/FeaturesSection";
import TopDestinations from "@/components/TopDestinations";
import Footer from "@/components/Footer";
import { fetchHome } from "@/services/publicApi";

const Index = () => {
  const homeQuery = useQuery({
    queryKey: ["public-home", { categories_limit: 6, promotions_limit: 3, trending_limit: 6 }],
    queryFn: () =>
      fetchHome({
        categories_limit: 12,
        promotions_limit: 3,
        trending_limit: 12,
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
      <PersonalizedRecommendations
        initialData={homeData?.recommended}
        initialMeta={homeData?.recommendations_meta}
      />
      <FeaturesSection />
      <TopDestinations categories={homeData?.categories} />
      <Footer />
    </div>
  );
};

export default Index;
